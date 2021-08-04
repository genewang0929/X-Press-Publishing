const express = require('express');
const sqlite3 = require('sqlite3');
const seriesRouter = express.Router();
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const issueRouter = require('./issue');

seriesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Series', (err, series) => {
        if(err) {
            next(err);
        } else {
            res.status(200).json({series: series});
        }
    })
})

seriesRouter.post('/', (req, res, next) => {
    const name = req.body.series.name;
    const description = req.body.series.description;
    if(name && description) {
        const sql = 'INSERT INTO Series (name, description) ' +
            'VALUES ($name, $description)';
        const values = {
            $name: name,
            $description: description
        }
        db.run(sql, values, function(err) {
            if(err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Series WHERE Series.id = ${this.lastID}`, (err, series) => {
                    res.status(201).json({series: series});
                })
            }
        })
    } else {
        res.sendStatus(400);
    }
})

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
    const sql = 'SELECT * FROM Series WHERE Series.id = $seriesId';
    const values = {$seriesId: seriesId};
    db.get(sql, values, (err, series) => {
        if(err) {
            next(err);
        } else if(series) {
            req.series = series;
            next();
        } else {
            res.sendStatus(404);
        }
    })
})

seriesRouter.use('/:seriesId/issues', issueRouter);

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).json({series: req.series});
})

seriesRouter.put('/:seriesId', (req, res, next) => {
    const name = req.body.series.name;
    const description = req.body.series.description;
    if(name && description) {
        const sql = 'Update Series SET name = $name, ' +
            'description = $description ' +
            'WHERE Series.id = $seriesId';
        const values = {
            $name: name,
            $description: description,
            $seriesId: req.params.seriesId
        }
        db.run(sql, values, (err) => {
            if(err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Series WHERE Series.id = ${req.params.seriesId}`, (err, series) => {
                    res.status(200).json({series: series});
                })
            }
        })
    } else {
        res.sendStatus(400);
    }
})

seriesRouter.delete('/:seriesId', (req, res, next) => {
    const issueSQL = 'SELECT * FROM Issue WHERE Issue.series_id = $seriesId';
    const issueValues = {$seriesId: req.params.seriesId};
    db.get(issueSQL, issueValues, (err, issue) => {
        if(err) {
            next(err);
        } else if(issue) {
            res.sendStatus(400);
        } else {
            const deleteSQL = 'DELETE FROM Series WHERE Series.id = $seriesId';
            const deleteValue = {$seriesId: req.params.seriesId};
            db.run(deleteSQL, deleteValue, (err) => {
                if(err) {
                    next(err);
                } else {
                    res.sendStatus(204);
                }
            })
        }
    })
})

module.exports = seriesRouter;