module.exports = {
    // InstagramBot.js Configs
    "debug": true,
    "login": true,
    "ui": false, // only for social-manager-tools

    // Instagram Account
    "instagram_username": "username", // without @
    "instagram_password": "password",
    "instagram_hashtag": ["tag1", "tag2", "tag3"], // without #, raccomanded more than 20
    "instagram_pin": "sms", // method to receive pin (email or sms)

    // BOT Configs
    // [WORK] likemode_classic          - select random hashtag from config list and like 1 random photo (of last 20) | 400-600 like/day.
    // [WORK] likemode_realistic        - select random hashtag from config list, like fast 10-12 photo and sleep 15-20min. Sleep at night
    // [WORK] likemode_superlike        - select random hashtag from config list and like 3 random photo of same user | 400-600 like/day.
    // [WORK] likemode_competitor_users - select account, select random followers, like 10-12 photo and sleep 15-20min.
    // [WORK] comment_mode              - leave a comment under the photo via hashtag.
    // [WORK] fdfmode_classic           - follow 30 users, and defollow the first followed at 31 follow (in loop). This method is not detected from socialblade. ~1h | 300/300 follow-defollow/day.
    "bot_likeday_min": 50,      // work only in likemode_classic
    "bot_likeday_max": 100,      // work only in likemode_classic. In 2018 limit instagram is 1000/day
    "bot_sleep_night": true,    // if you need stop bot in night 
    "bot_start_sleep": "7:00",   // sleep from 00:00 to 7:00 am, work in likemode_realistic, comment_mode, likemode_superlike and likemode_competitor_users
    "bot_superlike_n": 3,        // superlike number of likes for user
    "bot_followday": 100,        // number of follow-defollow user/day, work in fdfmode_classic. In 2018 limit instagram is 500/day
    "bot_followrotate": 31,      // follow 30 users, and defollow the first followed at 31 follow (in loop), work in fdfmode_classic | If is 0 defollow all followed previously by bot
    "bot_userwhitelist": [],
    "comment_mode": {
        "comments": {
            "type": "array",
            "source": ["comment1", "comment2"],
        }
    },
    // Puppeteer Configs
    "chrome_headless": true,
    "chrome_options": ["--disable-gpu", "--no-sandbox", "--window-size=1920x1080"],
    "executable_path": "/somepath", // example for Mac OS: /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome

    // DATABASES
    "fdfdatabase_path": "./databases/fdf.db", // databases with username of followed users with follodefollow mode
    "logdb_path": "./databases/logs.db",      // logs in sqllite database for better report

    // LOG
    "pin_path": "./loginpin.txt",
    "log_path": "./logs/debug.log",
    "logerr_path":"./logs/errors.log",
    "screenshot_path": "./logs/screenshot/",
    "log": {
        "drivers": ["console"], // slack or console
        "screenshot": true,  // disable or enable screenshot in logs folder
        "channels": {
            "console": "",
            "slack": {
                "webhook": ""
            }
        }
    }
};
