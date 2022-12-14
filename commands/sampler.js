const fs = require("fs");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, EmbedBuilder} = require('discord.js');
const { joinVoiceChannel, createAudioResource, entersState, VoiceConnectionStatus, StreamType, createAudioPlayer, AudioPlayerStatus, NoSubscriberBehavior} = require("@discordjs/voice");

module.exports = {
	data: {
    name: "sampler",
    description: "samplerを作るよ．色々オプションあるけどノリで頑張ってね．",
    options: [{
      type: 3,
      name: "voice",
      description: "Choice voice",
      autocomplete: true,
    },{
      type: 4,
      name: "button",
      description: "set button",
      choices: [...Array(16).keys()].map((d) => {return {name: d+1, value:d+1}}),
    },{
      type: 5,
      name: "list",
      description: "show sampler list"
    }]
  },
  async autocomplete(interaction){
    const focusedValue = interaction.options.getFocused();
    const choices = buildChoiceLists();
    const filtered = choices.filter(choice => choice.startsWith(focusedValue)).slice(0, 20);
    await interaction.respond(
      filtered.map(choice => ({name: choice, value: choice})),
    );
  },
	async execute(interaction, client) {
    await interaction.reply("読み込み中...");
    const buttonNumber = interaction.options.getInteger("button");
    const voiceName = interaction.options.getString("voice");
    const sampler = JSON.parse(fs.readFileSync("sampler.json", "utf8"));

    // embed
    if (interaction.options.getBoolean("list")){
      var embed = new EmbedBuilder();
      var embedNumbers = Object.keys(sampler).join("\n");
      var embedNames = Object.values(sampler).join("\n");

      embed.addFields(
        {
          name: 'Number',
          value: embedNumbers,
          inline: true
        },
        {
          name: 'Name',
          value: embedNames,
          inline: true
        }
      );
      await interaction.editReply("Sampler list");
      await interaction.editReply({
        embeds: [embed],
      });
    }

    // add
    if (voiceName && buttonNumber) {

      sampler[buttonNumber] = voiceName;

      fs.writeFileSync("sampler.json", JSON.stringify(sampler));
      await interaction.editReply(`追加しました${buttonNumber}: ${voiceName}`);

    } else if (voiceName) {
      await interaction.editReply("ボタン番号を設定してください");
      return;
    } else if (buttonNumber) {
      sampler[buttonNumber] = "-";

      fs.writeFileSync("sampler.json", JSON.stringify(sampler));
      await interaction.editReply("ボイスを削除しました");
      return;
    }

    // sampler
    const buttons = []

    for (let i=0; i<4; i++){
      var components = []
      for (let j=0; j<5; j++){
        // style
        var style = ButtonStyle.Secondary;
        if (i==0){
          style = ButtonStyle.Danger;
        } else if (j==0) {
          style = ButtonStyle.Success;
        }
        // label
        var label = 5*i+j+1;
        // id

        components.push(
          new ButtonBuilder()
            .setCustomId(String(label))
            //.setLabel(String(label))
            .setLabel("  ")
            .setStyle(style),
        );
      }
      buttons.push(new ActionRowBuilder().addComponents(components));
    }

    await interaction.editReply("Sampler");
    await interaction.editReply({
      components: buttons
    });
  },

  async button(interaction, client) {
    const guild = interaction.guild;
		
    var member = await guild.members.fetch(interaction.member.id);

    const memberVC = member.voice.channel;


    if(!memberVC) {
      return interaction.reply({
        content: "接続先のVCが見つかりません．",
        ephemeral: true,
      });
    }
    if(!memberVC.members) {
      return interaction.reply({
        content: "VCに接続できません．",
        ephemeral: true,
      });
    }
    if(memberVC.members.has(client.user.id)) {
      return interaction.reply({
        content: "VCにすでに接続されています．",
        ephemeral: true,
      });
    }
    if(!memberVC.joinable) {
      return interaction.reply({
        content: "VCに接続できません．",
        ephemeral: true,
      });
    }
    if(!memberVC.speakable) {
      return interaction.reply({
        content: "VCで発言する権限がありません．",
        ephemeral: true,
      });
    }

    const status = ["●Loading Sounds...", `●Connecting to ${memberVC}...`];
    const p = interaction.reply(status.join("\n"));
    const connection = joinVoiceChannel({
      guildId: guild.id,
      channelId: memberVC.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfMute: false,
    });

    const sampler = JSON.parse(fs.readFileSync("sampler.json", "utf8"));
    var fileName = sampler[interaction.customId];
    if(fileName == null || fileName == "-"){
      const fileList = buildChoiceLists();
      const fileNum = Math.floor(Math.random() * fileList.length)
      fileName = fileList[fileNum]
    }
    console.log(`playing  ./mp3/${fileName}.mp3`);
    const resource = createAudioResource(
      `./mp3/${fileName}.mp3`,
      { inputType: StreamType.Arbitrary}
    );
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    player.play(resource);
    const promises = [];
    promises.push(entersState(player, AudioPlayerStatus.AutoPaused, 1000*10).then(() => status[0]="Done!"));
    promises.push(entersState(connection, VoiceConnectionStatus.Ready, 1000*10).then(() => status[1]="Done!"));
    await Promise.race(promises);
    await p;
    await Promise.all([...promises, interaction.editReply(status.join("\n"))]);
    connection.subscribe(player);
    await entersState(player, AudioPlayerStatus.Playing, 100);

    await interaction.editReply("Playing");
    setTimeout(async () => {
      player.stop();
      await interaction.editReply("End");
      connection.destroy();
    }, 3_000);
    await entersState(player, AudioPlayerStatus.Idle, 30000);
    setTimeout(async () => {
      await interaction.deleteReply()
    }, 10_000);
    //await interaction.editReply("End");
    //onnection.destroy();
	}
}

function buildChoiceLists(){
  const mp3Files = fs.readdirSync('./mp3').filter(file => file.endsWith('.mp3'));

  const choices = []

  for (const file of mp3Files) {
    choices.push(file.slice(0, -4))
  }
  return choices
}
