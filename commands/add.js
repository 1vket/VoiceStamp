const fs = require("fs");
const rp = require('request-promise');
const ffmpeg = require('fluent-ffmpeg');

module.exports = {
	data: {
        name: "add",
        description: "音源を追加するよ．mp3 or mp4",
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

      await interaction.reply({ content:`追加しました!`, files:[file]});
      console.log(`mp3file add ${file.name}`);
    } else if (file.contentType === "video/mp4"){

      outputFileName = file.name.slice(0, -1) + '4'
      
      await interaction.reply({ content:`ooo 変換中 ooo`});

      ffmpeg(file.url).toFormat('mp3').save(`mp3/${outputFileName}`);

      await interaction.editReply({ content:`追加しました!`});
      
    } else {
      await interaction.reply("追加に失敗しました");
    }
	}
}

