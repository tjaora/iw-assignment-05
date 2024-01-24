var express = require("express");
const db = require("../database");
var router = express.Router();

router.get("/", async function (req, res) {
    // fetch data from postgres
    const result = await db.query("SELECT * FROM entries;");

    // send the data as response
    res.send(result.rows);
});

router.post("/", async function (req, res) {
    // read data from client
    const { title, value, type } = req.body;

    const errors = [];
    if (title.length < 5) {
        errors.push("Title is too short");
    }
    if (value < 0) {
        errors.push("Value must be positive");
    }
    if (!["income", "expense"].includes(type)) {
        errors.push("Invalid type - please use expense or income");
    }

    if (errors.length > 0) {
        return res.status(400).send({
            errorType: "VALIDATION_ERROR",
            errors,
        });
    }

    // save data to database
    const result = await db.query(
        `INSERT INTO entries (title, value, type) VALUES ($1, $2, $3) RETURNING *;`,
        [title, value, type]
    );

    // send the new entry as response
    res.send(result.rows[0]);
});

// GET a single entry by ID
router.get("/:id", async function (req, res) {
    try {
        const { id } = req.params;

        // fetch a single entry from the database based on ID
        const result = await db.query("SELECT * FROM entries WHERE id = $1;", [id]);

        // check if entry exists
        if (result.rows.length === 0) {
            return res.status(404).send({ errorType: "NOT_FOUND", message: "Entry not found" });
        }

        // send the entry as response
        res.send(result.rows[0]);
    } catch (error) {
        console.error("Error fetching entry:", error);
        res.status(500).send("Internal Server Error");
    }
});

// PATCH update a single entry
router.patch("/:id", async function (req, res) {
    try {
        const { id } = req.params;
        const { title, value, type } = req.body;

        // update data in the database
        const result = await db.query(
            `UPDATE entries SET title = $1, value = $2, type = $3 WHERE id = $4 RETURNING *;`,
            [title, value, type, id]
        );

        // check if entry exists
        if (result.rows.length === 0) {
            return res.status(404).send({ errorType: "NOT_FOUND", message: "Entry not found" });
        }

        // send the updated entry as response
        res.send(result.rows[0]);
    } catch (error) {
        console.error("Error updating entry:", error);
        res.status(500).send("Internal Server Error");
    }
});

// DELETE a single entry
router.delete("/:id", async function (req, res) {
    try {
        const { id } = req.params;

        // delete entry from the database
        const result = await db.query(`DELETE FROM entries WHERE id = $1 RETURNING *;`, [id]);

        // check if entry exists
        if (result.rows.length === 0) {
            return res.status(404).send({ errorType: "NOT_FOUND", message: "Entry not found" });
        }

        // send the deleted entry as response
        res.send(result.rows[0]);
    } catch (error) {
        console.error("Error deleting entry:", error);
        res.status(500).send("Internal Server Error");
    }
});


module.exports = router;
