const fs = require("fs");
const rp = require('request-promise');

module.exports = {
	data: {
        name: "add",
        description: "音源を追加するよ．mp3で指定してね．",
        options: [{
          type: 11,
          name: "mp3file",
          description: "attach mp3 file",
          required: true,
        }],
    },
	async execute(interaction, client) {
    const file = interaction.options.getAttachment("mp3file");

    if (file.contentType === "audio/mpeg"){
      var fileStream = fs.createWriteStream(`mp3/${file.name}`);

      rp(file.url).pipe(fileStream);

      await interaction.reply("Add!");
      console.log(`mp3file add ${file.name}`);
    } else {
      await interaction.reply("追加に失敗しました");
    }
	}
}

