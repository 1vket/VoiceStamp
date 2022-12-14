const fs = require('fs');
const { Client, GatewayIntentBits} = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const commands = {}
const commandFiles = fs.readdirSync('./commands').filter(
  file => file.endsWith('.js')
)

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands[command.data.name] = command;
}

client.once("ready", async () => {
  const data = [];
  for (const commandName in commands) {
    data.push(commands[commandName].data);
    console.log(commandName);
  }

  await client.application.commands.set(data);
  console.log("Ready!");
});

client.on("interactionCreate", async (interaction) => {
  
  if (interaction.isAutocomplete()){
    const command = commands[interaction.commandName];
    if(command) {
      try{
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(error);
      }
    }
  } else if (interaction.isCommand()) {
    const command = commands[interaction.commandName];
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      try{
        await interaction.reply({
          content: "Command Error",
          ephemeral: true,
        })
      } catch (err) {
        await interaction.editReply({
          content: "Command Error",
          ephemeral: true,
        })
      }
    }
  } else if (interaction.isButton()) {
    const command = commands["sampler"]; //fix someday
    try {
      await command.button(interaction, client);
    } catch (error) {
      console.error(error);
      try{
        await interaction.reply({
          content: "Command Error",
          ephemeral: true,
        })
      } catch (err) {
        await interaction.editReply({
          content: "Command Error",
          ephemeral: true,
        })
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

