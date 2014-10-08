TwitchBot
=========

An IRC bot for twitch.tv.

License is in License.txt.

Open config.txt and configure it before using.

In /data/ there is files which contain data and/or configuration for the plugins. Such as Announcement.js,
 and Admin.js. Admin.js has a file called admins.txt, it should contain a list of all admins (one name per line). announcement.txt
  contains the announcement the bot will say every once in a while.

*Commands:*
!merit - Display merit.
!merit on - Enable merit gain.
!merit off - Disable merit gain (suggested to prevent afk farming after done streaming).
!merit set [name] [amount] - Sets a user's merit.
!merit give [name] [amount] - Adds the given amount to the user's merit.
!merit take [name] [amount] - Removes the given amount from the user's merit.

!raffle [num_tickets] - Buys given number of tickets in exchange for merit.
!raffle start - Starts a new raffle.
!raffle stop - Stops the current raffle and returns merit to all those who entered.
!raffle end - Ends the current raffle (ends the timer).