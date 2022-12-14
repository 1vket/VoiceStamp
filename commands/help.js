const fs = require('fs');

module.exports = {
    data: {
      name: "help",
      description: "コマンドの説明をするよ",
    },
    async execute(interaction) {
        let str = ''
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
        const command = require(`./${file}`);
        str += `名前: ${command.data.name}, 詳細: ${command.data.description} \n`;
        }

        return interaction.reply({
        content: str,
        ephemeral: true,
        });
    },
};
