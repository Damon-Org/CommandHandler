import EventModule from './structures/EventModule.js'
import { ArgumentLimit } from './util/Constants.js'

export default class CommandHandler extends EventModule {
    _ready = 0;
    _prefixSupplier = null;

    constructor(main) {
        super(main);

        this.register(CommandHandler, {
            name: 'commandHandler',
            requires: [
                'commandRegistrar'
            ],
            events: [
                {
                    'name': 'messageCreate',
                    'call': '_onMessage'
                },
                {
                    'mod': 'commandRegistrar',
                    'name': 'ready',
                    'call': '_setReady'
                }
            ]
        });
    }

    get commandList() {
        return this._commandList;
    }

    get ready() {
        return this._ready;
    }

    /**
     * Tries to match a message's content against all the registered commands
     * @private
     * @param {Message} msgObj Discord.js Message Class instance
     * @param {Array<string>} ctx
     * @param {boolean} [mentioned=false] If the command was activated through a mention
     */
    _commandMatch(msgObj, ctx, mentioned = false) {
        const args = ctx.split(' ');

        if (args.length > ArgumentLimit) {
            msgObj.channel.send(`The amount of words passed exceeds the limit of supported arguments. If you think this is an error contact the developer.`);

            return false;
        }

        for (let i = args.length; 0 < i; i--) {
            const attempt = args.slice(0, i).join(' ');
            if (!this.commandList.has(attempt)) continue;

            const instance = this.commandList.get(attempt);
            const index = attempt.split(' ').length;
            const trigger = args.splice(0, index);

            try {
                const command = instance.clone();
                command.exec(msgObj, args, trigger.join(' '), mentioned);

                this.emit('command', command, msgObj, args, mentioned);
            } catch (e) {
                msgObj.channel.send(`An error occured while trying to run the following command \`${attempt}\`\nWith the following output: \`\`\`js\n${e.stack}\`\`\``);
            }

            return true;
        }

        return false;
    }

    /**
     * @private {Message} msgObj
     */
    async _onMessage(msgObj) {
        if (this._ready < 1) return false;
        if (msgObj.system) return false;
        if (msgObj.partial) return false;
        if (msgObj.type !== 'DEFAULT') return false;
        if (msgObj.author.bot) return false;

        // This regex will remove any redudant "spaces"
        const content = msgObj.content.replace(/\s+/g, ' ');

        let prefix = this.globalStorage.get('prefix');
        if (!this.config.development && msgObj.guild && this._prefixSupplier) {
            const server = this.servers.get(msgObj.guild.id);

            prefix = await this._prefixSupplier(server);
        }

        // check if the message starts with the prefix we want
        if (content.startsWith(prefix)) {
            const ctx = content.substr(prefix.length);

            return this._commandMatch(msgObj, ctx);
        }
        else if (this.config.allow_mention_prefix && content.match(/<@!?(\d+)>/i) && content.match(/<@!?(\d+)>/i)[1] == this._m.user.id) {
            const ctx = content.replace(/<@[^>]+> /, '');

            return this._commandMatch(msgObj, ctx, true);
        }

        return false;

    }

    /**
     * This method is meant to count the amount of submodules that should be ready before processing commands
     * @private
     */
    _setReady() {
        this._ready++;

        if (this._ready >= 1) this._commandList = this.modules.commandRegistrar.commandList;
    }

    /**
     * Set the prefix supplier, whenever your function is called
     * @param {Function} [call=null] The function that should be called to get a custom prefix for a server, leave empty to reset
     */
    setPrefixSupplier(call = null) {
        this._prefixSupplier = call;
    }
}
