/**
 * MODE: fdfmode_classic
 * =====================
 * Follow 30 users, and defollow the first followed at 31 follow (in loop). This method is not detected from socialblade or similar software.
 *
 * @author:     Patryk Rzucidlo [@ptkdev] <support@ptkdev.io> (https://ptkdev.it)
 * @license:    This code and contributions have 'GNU General Public License v3'
 * @version:    0.1
 * @changelog:  0.1 initial release
 *
 */
const Manager_state = require("../common/state").Manager_state;
class Fdfmode_classic extends Manager_state {
    constructor(bot, config, utils, db) {
        super();
        this.bot = bot;
        this.config = config;
        this.utils = utils;
        this.db = db["logs"];
        this.db_fdf = db["fdf"];
        this.cache_hash_tags = [];
        this.photo_liked = [];
        this.photo_current = "";
        this.LOG_NAME = "fdf_classic";
        this.STATE = require("../common/state").STATE;
        this.STATE_EVENTS = require("../common/state").EVENTS;
        this.Log = require("../logger/Log");
        this.log = new this.Log(this.LOG_NAME, this.config);
    }

    /**
     * Database init
     * =====================
     * Save users nickname and other information
     *
     */
    init_db() {
        let self = this;
        this.db.serialize(function() {
            self.db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, account TEXT, mode TEXT, username TEXT, photo_url TEXT, hashtag TEXT, type_action TEXT, inserted_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
        });

        this.db_fdf.serialize(function() {
            self.db_fdf.run("CREATE TABLE IF NOT EXISTS fdf (id INTEGER PRIMARY KEY AUTOINCREMENT, account TEXT, username TEXT, photo_url TEXT, hashtag TEXT, type_fdf TEXT, inserted_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
        });
    }

    /**
     * Get photo url from cache
     * =====================
     * @return {string} url
     *
     */
    get_photo_url() {
        let photo_url = "";
        do {
            photo_url = this.cache_hash_tags.pop();
        } while ((typeof photo_url === "undefined" || photo_url.indexOf("tagged") === -1) && this.cache_hash_tags.length > 0);

        return photo_url;
    }

    /**
     * Fdfmode_classic: Open Hashtag
     * =====================
     * Get random hashtag from array and open page
     *
     */
    async fdf_open_hashtagpage() {
        this.hashtag_tag = this.utils.get_random_hash_tag();
        this.log.info(`current hashtag ${this.hashtag_tag}`);
        try {
            await this.bot.goto("https://www.instagram.com/explore/tags/" + this.hashtag_tag + "/");
        } catch (err) {
            this.log.error(`goto ${err}`);
        }

        await this.utils.sleep(this.utils.random_interval(4, 8));

        await this.utils.screenshot(this.LOG_NAME, "last_hashtag");
    }

    /**
     * Fdfmode_classic: Open Photo
     * =====================
     * Open url of photo and cache urls from hashtag page in array
     *
     */
    async fdf_get_urlpic() {
        this.log.info("fdf_get_urlpic");

        let photo_url = "";

        if (this.cache_hash_tags.length <= 0) {
            try {
                this.cache_hash_tags = await this.bot.$$eval("article a", hrefs => hrefs.map((a) => {
                    return a.href;
                }));

                await this.utils.sleep(this.utils.random_interval(10, 15));

                if (this.utils.is_debug()) {
                    this.log.debug(`array photos ${this.cache_hash_tags}`);
                }

                photo_url = this.get_photo_url();

                this.log.info(`current photo url ${photo_url}`);
                if (typeof photo_url === "undefined") {
                    this.log.warning("check if current hashtag have photos, you write it good in config.js? Bot go to next hashtag.");
                    photo_url = this.get_photo_url();
                    if (photo_url == "" || typeof photo_url === "undefined") {
                        this.cache_hash_tags = [];
                    }
                }

                await this.utils.sleep(this.utils.random_interval(4, 8));

                if (this.cache_hash_tags.length > 0) {
                    await this.bot.goto(photo_url);
                }
            } catch (err) {
                this.cache_hash_tags = [];
                this.log.error(`fdf_get_urlpic error ${err}`);
                await this.utils.screenshot(this.LOG_NAME, "fdf_get_urlpic_error");
            }
        } else {
            photo_url = this.get_photo_url();

            this.log.info(`current photo url from cache ${photo_url}`);
            await this.utils.sleep(this.utils.random_interval(4, 8));

            try {
                await this.bot.goto(photo_url);
            } catch (err) {
                this.log.error(`goto ${err}`);
            }
        }

        if (this.cache_hash_tags.length > 0) {
            this.photo_current = photo_url.split("?tagged")[0];
            if (typeof photo_url !== "undefined") {
                if (typeof this.photo_liked[this.photo_current] === "undefined") {
                    this.photo_liked[this.photo_current] = 1;
                } else {
                    this.photo_liked[this.photo_current]++;
                }

            }
            await this.utils.sleep(this.utils.random_interval(4, 8));
        }
    }

    /**
     * Fdfmode_classic: Follow me
     * =====================
     * Click on follow and verify if instagram not (soft) ban you
     *
     */
    async fdf_click_follow() {
        this.log.info("try follow");

        await this.bot.waitForSelector("article div a:nth-child(1)");
        let username = await this.bot.evaluate(el => el.innerHTML, await this.bot.$("article div a:nth-child(1)"));
        this.log.info("username " +username);

        if (this.config.bot_userwhitelist.includes(username)) {
            this.log.warning(username + ": is in whitelits, ignored by follow.");
        } else {
            try {
                await this.bot.waitForSelector("article header div div button");
                let button = await this.bot.$("article header div div button");
                let button_before_click = await this.bot.evaluate(el => el.innerHTML, await this.bot.$("article header div div button"));
                this.log.info("button text before click: " + button_before_click);
                if (this.photo_liked[this.photo_current] > 1) {
                    this.log.warning("followed previously");
                    this.db.run("INSERT INTO users (account, mode, username, photo_url, hashtag, type_action) VALUES (?, ?, ?, ?, ?, ?)", this.config.instagram_username, this.LOG_NAME, username, this.photo_current, this.hashtag_tag, "followed previously");
                } else {
                    await button.click();

                    await this.utils.sleep(this.utils.random_interval(2, 3));

                    await this.bot.waitForSelector("article header div div button");
                    let button_after_click = await this.bot.evaluate(el => el.innerHTML, await this.bot.$("article header div div button"));
                    this.log.info("button text after click: " + button_after_click);

                    if (button_after_click != button_before_click) {
                        this.log.info("follow");
                        this.db.run("INSERT INTO users (account, mode, username, photo_url, hashtag, type_action) VALUES (?, ?, ?, ?, ?, ?)", this.config.instagram_username, this.LOG_NAME, username, this.photo_current, this.hashtag_tag, "follow");
                        this.db_fdf.run("INSERT INTO fdf (account, username, photo_url, hashtag, type_fdf) VALUES (?, ?, ?, ?, ?)", this.config.instagram_username, username, this.photo_current, this.hashtag_tag, "follow");
                    } else {
                        this.log.warning("not follow");
                    }

                }
                this.emit(this.STATE_EVENTS.CHANGE_STATUS, this.STATE.OK);
            } catch (err) {
                if (this.utils.is_debug()) {
                    this.log.debug(err);
                }

                this.log.warning("follow error");
                this.db.run("INSERT INTO users (account, mode, username, photo_url, hashtag, type_action) VALUES (?, ?, ?, ?, ?, ?)", this.config.instagram_username, this.LOG_NAME, username, this.photo_current, this.hashtag_tag, "follow error");
                this.emit(this.STATE_EVENTS.CHANGE_STATUS, this.STATE.ERROR);
            }

            await this.utils.sleep(this.utils.random_interval(4, 8));

            await this.utils.screenshot(this.LOG_NAME, "last_follow_after");
        }
    }

    /**
     * Get all follow user
     * =====================
     * SQL get all users with follow type_action, for defollow next time
     *
     */
    async get_row_from_database() {
        let self = this;
        return new Promise(function(resolve) {
            self.db_fdf.all("SELECT * FROM fdf WHERE type_fdf = 'follow' ORDER BY id ASC", function(err, row) {
                if (err) {
                    self.log.warning("get_row_from_database() error select " + err);
                }
                resolve(row);
            });
        });
    }

    /**
     * Get all follow user
     * =====================
     * SQL get all users with follow type_action, for defollow next time
     *
     */
    async goto_user_for_defollow(photo_url) {
        this.log.info("go to url for try defollow");
        await this.bot.goto(photo_url);
    }


    /**
     * Fdfmode_classic: Defollow me
     * =====================
     * Click on defollow and verify if instagram not (soft) ban you
     *
     */
    async fdf_click_defollow() {
        this.log.info("try defollow");

        await this.bot.waitForSelector("article div a:nth-child(1)");
        let username = await this.bot.evaluate(el => el.innerHTML, await this.bot.$("article div a:nth-child(1)"));
        this.log.info("username " +username);

        try {
            await this.bot.waitForSelector("article header div div button");
            let button = await this.bot.$("article header div div button");
            let button_before_click = await this.bot.evaluate(el => el.innerHTML, await this.bot.$("article header div div button"));
            this.log.info("button text before click: " + button_before_click);

            if (this.photo_liked[this.photo_current] > 1) {
                this.log.warning("followed previously");
                this.db.run("INSERT INTO users (account, mode, username, photo_url, hashtag, type_action) VALUES (?, ?, ?, ?, ?, ?)", this.config.instagram_username, this.LOG_NAME, username, this.photo_current, this.hashtag_tag, "defollowed previously");
            } else {
                await button.click();

                await this.utils.sleep(this.utils.random_interval(2, 3));

                await this.bot.waitForSelector("div[role=\"dialog\"] div button:nth-child(1)");
                let button_confirm = await this.bot.$("div[role=\"dialog\"] div button:nth-child(1)");

                await button_confirm.click();

                await this.utils.sleep(this.utils.random_interval(1, 2));

                await this.bot.waitForSelector("article header div div button");
                let button_after_click = await this.bot.evaluate(el => el.innerHTML, await this.bot.$("article header div div button"));
                this.log.info("button text after click: " + button_after_click);

                if (button_after_click != button_before_click) {
                    this.log.info("defollow");
                    this.db.run("INSERT INTO users (account, mode, username, photo_url, hashtag, type_action) VALUES (?, ?, ?, ?, ?, ?)", this.config.instagram_username, this.LOG_NAME, username, this.photo_current, this.hashtag_tag, "defollow");
                    this.db_fdf.run("UPDATE fdf SET type_fdf = ? WHERE account = ? AND username = ?", "defollow", this.config.instagram_username, username);
                } else {
                    this.log.warning("not defollow, try at next rotation");
                }
            }
            this.emit(this.STATE_EVENTS.CHANGE_STATUS, this.STATE.OK);
        } catch (err) {
            if (this.utils.is_debug()) {
                this.log.debug(err);
            }

            this.log.warning("defollow error");
            this.db.run("INSERT INTO users (account, mode, username, photo_url, hashtag, type_action) VALUES (?, ?, ?, ?, ?, ?)", this.config.instagram_username, this.LOG_NAME, username, this.photo_current, this.hashtag_tag, "defollow error");
            this.emit(this.STATE_EVENTS.CHANGE_STATUS, this.STATE.ERROR);
        }

        await this.utils.sleep(this.utils.random_interval(4, 8));

        await this.utils.screenshot(this.LOG_NAME, "last_defollow_after");
    }

    /**
     * FdfMode Classic Flow
     * =====================
     *
     */
    async start() {
        this.log.info("classic");

        let today = "";

        this.init_db();

        do {
            today = new Date();
            this.log.info("time night: " + (parseInt(today.getHours() + "" + (today.getMinutes() < 10 ? "0" : "") + today.getMinutes())));

            if (this.config.bot_sleep_night === false) {
                this.config.bot_start_sleep = "00:00";
            }
            if ((parseInt(today.getHours() + "" + (today.getMinutes() < 10 ? "0" : "") + today.getMinutes()) >= (this.config.bot_start_sleep).replace(":", ""))) {

                this.log.info("loading... " + new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes(), today.getSeconds()));

                // defollow flow
                let users = await this.get_row_from_database();

                if (typeof users !== "undefined" && users.length > this.config.bot_followrotate) {
                    this.log.info("defollow flow start");
                    let rotate = users.length - this.config.bot_followrotate;
                    this.log.info("defollow rotate tot: " + rotate);
                    for (let ir = 0; ir < rotate; ir++) {
                        this.log.info("defollow rotate n: " + rotate);
                        this.log.info("defollow user from photo: " + users[ir].photo_url);
                        await this.goto_user_for_defollow(users[ir].photo_url);
                        await this.utils.sleep(this.utils.random_interval(4, 8));
                        await this.fdf_click_defollow();
                    }
                }

                if (this.config.bot_followrotate == 0) {
                    this.log.info("bot defollow all followed user by this app");
                    this.bot.close();
                }

                this.log.info("cache array size " + this.cache_hash_tags.length);
                if (this.cache_hash_tags.length <= 0) {
                    await this.fdf_open_hashtagpage();
                }

                await this.utils.sleep(this.utils.random_interval(4, 8));

                await this.fdf_get_urlpic();

                await this.utils.sleep(this.utils.random_interval(4, 8));

                if (this.cache_hash_tags.length > 0) {
                    await this.fdf_click_follow();
                }

                await this.utils.sleep(this.utils.random_interval(4, 8));


                if (this.cache_hash_tags.length < 9) { //remove popular photos
                    this.cache_hash_tags = [];
                }

                if (this.cache_hash_tags.length <= 0) {
                    this.log.info("finish follow, bot sleep " + this.config.bot_fastlikefdf_min + "-" + this.config.bot_fastlikefdf_max + " minutes");
                    this.cache_hash_tags = [];
                    await this.utils.sleep(this.utils.random_interval(60 * this.config.bot_fastlikefdf_min, 60 * this.config.bot_fastlikefdf_max));
                }
            } else {
                this.log.info("is night, bot sleep");
                await this.utils.sleep(this.utils.random_interval(60 * 4, 60 * 5));
            }
        } while (true);
    }

}

module.exports = (bot, config, utils, db) => {
    return new Fdfmode_classic(bot, config, utils, db);
};
