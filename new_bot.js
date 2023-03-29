const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { promisify } = require('util');

const apiToken = "INSERT YOUR API TOKEN";
const bot = new TelegramBot(apiToken, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '/checkattendance') {
    try {
      const { attendanceList, numEntries } = await getAttendanceData();
      const messageText = `Attendance list:\n${attendanceList}\n\nNumber of employees on premises: ${numEntries}`;
      bot.sendMessage(chatId, messageText);
      console.log('Attendance list sent successfully');
    } catch (err) {
      console.error(err);
    }
  } else if (text === '/start') {
    bot.sendMessage(chatId, "Welcome, enter '/checkattendance' for attendance list");
  } else {
    bot.sendMessage(chatId, `You said: ${text}`);
  }
});

async function getAttendanceData() {
  try {
    const readFileAsync = promisify(fs.readFile);
    const data = await readFileAsync('file.json');

    if (!data) {
      console.error('File is empty');
      return { attendanceList: '', numEntries: 0 };
    }

    const people = JSON.parse(data);
    let attendanceSheet = [];

    for (const person of people) {
      const attendanceLogs = person['hub_attendance_logs'];

      if (!attendanceLogs || attendanceLogs.length === 0) {
        continue;
      }

      const lastAttendanceLog = attendanceLogs[attendanceLogs.length - 1];

      if (lastAttendanceLog['type'] === 'IN') {
        const addToList = {
          "name": person['name'], "location": lastAttendanceLog['location']
        };
        attendanceSheet.push(addToList);
      }
    }

    const attendanceList = attendanceSheet.map(({ name, location }) => `${name} - ${location}`).join('\n');
    const numEntries = attendanceSheet.length;
    return { attendanceList, numEntries };
  } catch (err) {
    console.error(err);
    throw err;
  }
}
