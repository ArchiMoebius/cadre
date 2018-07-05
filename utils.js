const moment = require('moment');
const sleep = require('sleep');

module.exports = {

  delayIfFasterThan: async (delay, executionTime) => {
    const totalExecutionTimeLeft = moment().unix() - executionTime;

    if (totalExecutionTimeLeft >= 0) {//laymans attempt at constant time function

      if (totalExecutionTimeLeft > delay) {
        console.log("need to increase delay time...");//TODO: add logging
        delay = totalExecutionTimeLeft;
      } else {
        delay = delay - totalExecutionTimeLeft;
      }

      sleep.msleep(delay);
    }
  }
};
