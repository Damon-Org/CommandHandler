import EventModule from './structures/EventModule.js'

export default class CommandHandler extends EventModule {
    _ready = 0;

    constructor(main) {
        super(main);

        this.register(CommandHandler, {
            name: 'commandHandler',
            scope: 'global',
            requires: [
                'commandRegistrar',
                'guildSettings'
            ],
            events: [
                {
                    'name': 'message',
                    'call': '_onMessage'
                },
                {
                    'mod': 'commandRegistrar',
                    'name': 'ready',
                    'call': '_setReady'
                },
                {
                    'mod': 'guildSettings',
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

        for (let i = args.length; 0 < i; i--) {
            const attempt = args.slice(0, i).join(' ');
            const match = this.commandList.get(attempt);
            if (!match) continue;

            const instance = match;
            const index = attempt.split(' ').length;
            const trigger = args.splice(0, index);

            try {
                const clone = instance.clone();
                clone.check(msgObj, args, trigger.join(' '), mentioned);

                this.emit('command', instance, msgObj, args, mentioned);
            } catch (e) {
                msg.channel.send(`An error occured while trying to run the following command \`${attempt}\`\nWith the following output: \`\`\`js\n${e.stack}\`\`\``);
            }

            return true;
        }

        return false;
    }

    /**
     * @private {Message} msgObj
     */
    _onMessage(msgObj) {
        if (this.ready !== 2) return false;
        if (msgObj.system) return false;
        if (msgObj.partial) return false;
        if (msgObj.type !== 'DEFAULT') return false;
        if (msgObj.author.bot) return false;

        // This regex will remove any redudant "spaces"
        const content = msgObj.content.replace(/\s+/g, ' ');

        let prefix = this.globalStorage.get('prefix');
        if (!this.config.development && msgObj.guild) {
            const server = this.servers.get(msgObj.guild.id);
            prefix = server.prefix;
        }

        // check if the message starts with the prefix we want
        if (content.startsWith(prefix)) {
            const ctx = content.substr(prefix.length);

            return this._commandMatch(msgObj, ctx);
        }
        else if (this.config.allow_mention_prefix && content.match(/<@!?(\d+)>/i) && content.match(/<@!?(\d+)>/i)[1] == this.mainClient.user.id) {
            const ctx = content.replace(/<@[^>]+> /, '');

            return this._commandMatch(msgObj, ctx, true);
        }

        return false;

    }

    /**
     * @private
     */
    _setReady() {
        this._ready++;

        if (this._ready >= 2) this._commandList = this.getModule('commandRegistrar').commandList;
    }

    setup() {
        return true;
    }
}
