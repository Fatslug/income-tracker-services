const Entry = require('../schema/entry.schema');
const chalk = require('chalk');
const moment = require('moment');

const paymentMethodsMap = [{
  0: 'Cash',
  1: 'Credit',
  2: 'Venmo',
  3: 'Apple Pay'
}];

exports.addEntry = addEntry;
exports.getEntries = getEntries;
exports.getEntryByID = getEntryByID;
exports.updateEntryByID = updateEntryByID;
exports.deleteEntryByID = deleteEntryByID;

/**
 * Adds a new entry to the database
 * @param {object} req Request object
 * @param {object} res Response object
 * @returns {object} HTTP response
 */
function addEntry(req, res) {
  console.log(chalk.blue('/entries/'));
  console.log(chalk.black.bgBlue('Adding Entry...'));

  const entry = new Entry(req.body.entry);
  console.log(entry);

  try {
    entry.save();
    res.status(200).send({
      success: true,
      body: entry
    });
  } catch (e) {
    console.log(chalk.red(e));
    res.status(500).send({
      success: false,
      message: 'Failed to save entry'
    })
  }
}

/**
 * Gets all entries from database
 * @param {object} req Request object
 * @param {object} res Response object
 * @returns {object} HTTP response
 */
function getEntries(req, res) {
  console.log('GET', chalk.blue('/entries/'));
  console.log(chalk.black.bgBlue('Getting Entries...'));

  const { f, t, pm } = req.query;
  const query = {
    Deleted: {
      $ne: true
    }
  };

  query.DateAdded = {
    $lte: new Date(moment(parseInt(t) || new Date()).format()),
    $gte: new Date(f ? moment(parseInt(f)).format() : moment().subtract(20, 'days').format())
  }

  if (pm) {
    query.PaymentMethods.$elemMatch.$or = [];
    pm.split(',').forEach((method, i) => {
      query.PaymentMethods.$elemMatch.$or.push({ PaymentType: paymentMethodsMap[method] });
    });
  }

  console.log(query);

  try {
    Entry.aggregate([
      { $match: query }
    ]).exec((err, entries) => {
      if (err) { throw(err); }
      res.status(200).send({
        success: true,
        body: {
          totalAmount: entries.reduce((acc, curr) => {
            if (curr.AmountPaid) {
              return acc + curr.AmountPaid;
            } else {
              let totalPaid = 0;
              curr.PaymentMethods.forEach((paymentMethod) => {
                totalPaid += paymentMethod.AmountPaid;
              });
              return acc + totalPaid;
            }
          }, 0),
          entries: entries.sort((a, b) => {
            return new Date(b.DateAdded) - new Date(a.DateAdded);
          })
        }
      })
    })
  } catch (e) {
    console.log(chalk.red(e));
    res.status(500).send({
      success: false,
      message: 'Failed to get all entries'
    })
  }
}

/**
 * Get specific entry in database
 * @param {object} req Request object
 * @param {object} res Response object
 * @returns {object} HTTP response
 */
function getEntryByID(req, res) {
  const entryID = req.params.entryID;
  console.log('GET', chalk.blue('/entries/'), entryID);
  console.log(chalk.black.bgBlue(`Getting Entry ID: ${entryId}...`));

  try {
    Entry.findById(entryID).exec((err, entry) => {
      if (err) { throw(err); }
      if (entry.Deleted) {
        throw(true);
      }
      res.status(200).send({
        success: true,
        body: {
          entry: entry
        }
      });
    })
  } catch (e) {
    console.log(chalk.red(e));
    res.status(500).send({
      success: false,
      message: 'Failed to get entry'
    })
  }
}

/**
 * Update specific entry in database
 * @param {object} req Request object
 * @param {object} res Response object
 * @returns {object} HTTP response
 */
function updateEntryByID(req, res) {
  const entryID = req.params.entryID;
  const updates = req.body.entry;
  console.log('UPDATE', chalk.blue('/entries/'), entryID);
  console.log(chalk.black.bgBlue('Updating Entry...'));

  try {
    Entry.findByIdAndUpdate(entryID, {
      ClientName: updates.ClientName,
      ServicesRendered: updates.ServicesRendered,
      DateAdded: updates.DateAdded,
      PaymentMethods: updates.PaymentMethods
    }, { new: true }).exec((err, newEntry) => {
      if (err) { throw(err); }
      res.status(200).send({
        success: true,
        body: {
          entry: newEntry
        }
      })
    })
  } catch (e) {
    console.log(chalk.red(e));
    res.status(500).send({
      success: false,
      message: 'Failed to update entry'
    })
  }
}

/**
 * Delete entry in database
 * @param {object} req Request object
 * @param {object} res Response object
 * @returns {object} HTTP response
 */
function deleteEntryByID(req, res) {
  const entryID = req.params.entryID;
  console.log('DELETE', chalk.blue('/entries/'), entryID);
  console.log(chalk.black.bgBlue('Deleting Entry...'));

  try {
    Entry.findByIdAndUpdate(entryID, {
      Deleted: true
    }, { new: true }).exec((err, newEntry) => {
      if (err) { throw(err); }
      res.status(200).send({
        success: true,
        body: {
          entry: newEntry
        }
      })
    })
  } catch (e) {
    console.log(chalk.red(e));
    res.status(500).send({
      success: false,
      message: 'Failed to update entry'
    })
  }
}