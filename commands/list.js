const fs = require("fs");
const { EmbedBuilder } = require("discord.js");

module.exports = {
	data: {
        name: "list",
        description: "音源一覧を表示するよ",
    },
	async execute(interaction, client) {

    const mp3Files = fs.readdirSync('./mp3').filter(file => file.endsWith('.mp3')).map(file => file.replace(".mp3", ""));

    var embed = new EmbedBuilder()
      .setTitle("GP list")
      .setColor(0x18e1ee);

		var splitNum = Math.floor(mp3Files.length / 3);
		
		embed.addFields(
			{
				name: '1',
				value: mp3Files.slice(0,splitNum).join("\n"),
				inline: true
			},
			{
				name: '2',
				value: mp3Files.slice(splitNum,splitNum*2).join("\n"),
				inline: true
			},
			{
				name: '3',
				value: mp3Files.slice(splitNum*2).join("\n"),
				inline: true
			}
		);

		await interaction.reply({embeds: [embed]});
	}
}
