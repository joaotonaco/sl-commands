import {
	CommandInteractionOptionResolver,
	GuildMember,
	Collection,
	Message,
} from 'discord.js'

import { CommandExecuteObject, CommandExecute, SLInteraction } from './types'
import SLHandler, { SLCommand, SLSubCommand } from '.'

type SCollection = Collection<string, SLSubCommand>
type CCollection = Collection<string, SLCommand>
type OptRsvlr = CommandInteractionOptionResolver

class CommandListener {
	constructor(
		public handler: SLHandler,
		commands: CCollection,
		subcommands: SCollection
	) {
		handler.client.on('interactionCreate', async raw => {
			if (!raw.isChatInputCommand() && !raw.isContextMenuCommand()) return

			const command = commands.get(raw.commandName)
			const interaction = raw as SLInteraction

			if (!command) return

			const { member, guild, user, channel, locale, options } = interaction

			let check = await this.isAvailable(interaction, command)

			if (check) {
				if (check !== true) {
					interaction.reply(check)
				}

				return
			}

			let execute = command.executeFunction as CommandExecute

			let cbObject: CommandExecuteObject = {
				client: handler.client,
				options: undefined!,
				channel: undefined!,
				guild: guild!,
				interaction,
				handler,
				locale,
				member,
				user,
			}

			if (interaction.isChatInputCommand()) {
				const { commandName } = interaction

				const subCommand = subcommands.find(s =>
					options.data.some(
						({ name }) => s.name === name && s.reference === commandName
					)
				)

				if (subCommand) {
					execute = subCommand.executeFunction as CommandExecute

					cbObject = Object.assign(cbObject, {
						options: options as OptRsvlr,
						channel: channel!,
					})
				}
			} else if (interaction.isUserContextMenuCommand()) {
				cbObject = Object.assign(cbObject, {
					target: interaction.targetMember as GuildMember,
				})
			} else if (interaction.isMessageContextMenuCommand()) {
				cbObject = Object.assign(cbObject, {
					target: interaction.targetMessage as Message,
					channel: channel!,
				})
			} else {
				cbObject = Object.assign(cbObject, {
					options: options as OptRsvlr,
					channel: channel!,
				})
			}

			try {
				await execute(cbObject)
			} catch (err) {
				if (!(err instanceof Error)) {
					err = new Error(String(err))
				}

				handler.emit(
					'commandException',
					command.name ?? 'unknown',
					err as Error,
					interaction
				)
			}
		})
	}

	private async isAvailable(
		interaction: SLInteraction,
		{ devsOnly }: SLCommand
	) {
		let { language, botDevsIds, messageHandler, useDefaultMessages } =
			this.handler

		let { user } = interaction

		if (!(devsOnly && !botDevsIds.includes(user.id))) {
			return
		}

		if (!useDefaultMessages) {
			this.handler.emit('commandDevsOnly', interaction)

			return true
		}

		return {
			content: messageHandler.getMessage('DevsOnly', language),
			ephemeral: true,
		}
	}
}

export = CommandListener
