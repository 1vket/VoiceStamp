const fs = require("fs");
const { EmbedBuilder } = require("discord.js");

module.exports = {
	data: {
        name: "list",
        description: "Show voice list",
    },
	async execute(interaction, client) {

    const mp3Files = fs.readdirSync('./mp3').filter(file => file.endsWith('.mp3'));

    var embed = new EmbedBuilder()
      .setTitle("GP list")
      .setColor(0x18e1ee);

    var value = '';
    for (const file of mp3Files) {
      value += '┣ ' + file + '\n';
    }

    embed.addFields({
      name: "GP List",
      value: value,
      inline: true
    });

		await interaction.reply({embeds: [embed]});
	}
}
