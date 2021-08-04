const express = require('express');
const sqlite3 = require('sqlite3');
const issueRouter = express.Router({mergeParams: true});
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

issueRouter.get('/', (req, res, next) => {
    const sql = 'SELECT * FROM Issue ' +
        'WHERE Issue.series_id = $seriesId';
    const values = { $seriesId: req.params.seriesId};
    db.all(sql, values, (err, issues) => {
        if(err) {
            next(err);
        } else {
            res.status(200).json({issues: issues});
        }
    })
})

issueRouter.post('/', (req, res, next) => {
    const name = req.body.issue.name;
    const issueNumber = req.body.issue.issueNumber;
    const publicationDate = req.body.issue.publicationDate;
    const artistId = req.body.issue.artistId;
    const artistSQL = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
    const artistValues = {$artistId: artistId};
    db.get(artistSQL, artistValues, (err) => {
        if(err) {
            next(err);
        } else {
            if(name && issueNumber && publicationDate && artistId) {
                const sql = 'INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) ' +
                    'VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)';
                const values = {
                    $name: name,
                    $issueNumber: issueNumber,
                    $publicationDate: publicationDate,
                    $artistId: artistId,
                    $seriesId: req.params.seriesId
                }
                db.run(sql, values, function (err) {
                    if(err) {
                        next(err);
                    } else {
                        db.get(`SELECT * FROM Issue WHERE Issue.id = ${this.lastID}`, (err, issue) => {
                            res.status(201).json({issue: issue});
                        })
                    }
                })
            } else {
                res.sendStatus(400);
            }
        }
    })
})

issueRouter.param('issueId', (req, res, next, issueId) => {
    const sql = 'SELECT * FROM Issue WHERE Issue.id = $issueId';
    const values = {$issueId: issueId}
    db.get(sql, values, (err, issue) => {
        if(err) {
            next(err);
        } else if(issue) {
            next();
        } else {
            res.sendStatus(404);
        }
    })
})

issueRouter.put('/:issueId', (req, res, next) => {
    const name = req.body.issue.name;
    const issueNumber = req.body.issue.issueNumber;
    const publicationDate = req.body.issue.publicationDate;
    const artistId = req.body.issue.artistId;
    const artistSQL = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
    const artistValues = {$artistId: artistId};
    db.get(artistSQL, artistValues, (err, artist) => {
        if(err) {
            next(err);
        } else {
            if(name && issueNumber && publicationDate && artist) {
                const sql = 'UPDATE Issue SET name = $name, issue_number = $issueNumber, ' +
                    'publication_date = $publicationDate, artist_id = $artistId '+
                    'WHERE Issue.id = $issueId';
                const values = {
                    $name: name,
                    $issueNumber: issueNumber,
                    $publicationDate: publicationDate,
                    $artistId: artistId,
                    $issueId: req.params.issueId
                }
                db.run(sql, values, function (err) {
                    if(err) {
                        next(err);
                    } else {
                        db.get(`SELECT * FROM Issue WHERE Issue.id = ${req.params.issueId}`, (err, issue) => {
                            res.status(200).json({issue: issue});
                        })
                    }
                })
            } else {
                res.sendStatus(400);
            }
        }
    })
})

issueRouter.delete('/:issueId', (req, res, next) => {
    const sql = 'DELETE FROM Issue WHERE Issue.id = $issueId';
    const values= {$issueId: req.params.issueId};
    db.run(sql, values, (err) => {
        if(err) {
            next(err);
        } else {
            res.sendStatus(204);
        }
    })
})

module.exports = issueRouter;