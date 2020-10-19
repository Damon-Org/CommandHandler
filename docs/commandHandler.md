# Command Handler Documentation

## Table of Contents

- [Module: CommandHandler](#module-commandhandler)
  - [Properties](#properties)
  - [Methods](#methods)
    - [commandHandler.setPrefixSupplier([call])](#commandhandlersetprefixsupplier-call)
  - [Events](#events)
    - [`command`](#event-command)


## Module: CommandHandler

The module uses an unmodified version `EventModule` class.

## Properties

 * Name: `commandHandler`
 * Requires: [[`commandRegistrar`](https://github.com/Damon-Org/CommandRegistrar)]
 * Used Events:
    * CommandRegistrar: `ready`
    * `message`

## Methods

### commandHandler.setPrefixSupplier([call])

- `call` {Function} The function to be called whenever the CommandHandler requests a prefix from the supplier for a guild.

Your function should expect a server instance as argument, you can from this server instance get the ID and match it with a custom prefix.

Example code:
```js
/**
 * @param {Server} server The server instance to fetch the prefix for
 * @returns {string} The string representing the custom prefix
 */
function getPrefix(server) {
    const guildId = server.id;

    // Whatever your way of storing the prefix is
    const prefix = this.storage.getPrefix(guildId);

    return prefix;
}
```
Returns `void`.

## Events

### Event: 'command'

- `instance` {Class} The instance of the command that is handling the command
- `msgObj` {Discord.Message} The original message that triggered the command
- `args` {string[]} The parsed arguments from the message
- `mentioned` {boolean} If the command was triggered, not by the prefix but by mentioning the bot

This event is called whenever a command is executed.
