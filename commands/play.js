const fs = require("fs");
const { joinVoiceChannel, createAudioResource, entersState, VoiceConnectionStatus, StreamType, createAudioPlayer, AudioPlayerStatus, NoSubscriberBehavior} = require("@discordjs/voice");

module.exports = {
	data: {
    name: "play",
    description: "音源を再生するよ",
    options: [{
      type: 3,
      name: "voice",
      description: "Choice voice",
      autocomplete: true,
    }]
  },
  async autocomplete(interaction){
    const focusedValue = interaction.options.getFocused();
    const choices = buildChoiceLists();
    const filtered = choices.filter(choice => choice.startsWith(focusedValue));
    await interaction.respond(
      filtered.map(choice => ({name: choice, value: choice})),
    );
  },
	async execute(interaction, client) {
    const guild = interaction.guild;
    const member = await guild.members.fetch(interaction.member.id);
    const memberVC = member.voice.channel;


    if(!memberVC) {
      return interaction.reply({
        content: "接続先のVCが見つかりません．",
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

    var fileName = interaction.options.getString("voice");
    if(fileName == null){
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
