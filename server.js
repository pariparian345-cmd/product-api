const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const client = new MongoClient(process.env.MONGODB_URI);

let db;
let products;


// ================================
// CONNECT MONGODB
// ================================

async function connectMongoDB() {

    await client.connect();

    db = client.db("product_db");

    products = db.collection("products");

    console.log("MongoDB connected");

}


// ================================
// TEST API
// ================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "Product API berjalan"
    });

});


// ================================
// GET ALL PRODUCTS
// ================================

app.get("/products", async (req, res) => {

    try {

        const data = await products
            .find({})
            .sort({ id: 1 })
            .toArray();

        const result = data.map(product => ({
            id: String(product.id),
            nama_produk: product.nama_produk,
            tautan: product.tautan,
            deskripsi: product.deskripsi,
            pin: Number(product.pin) || 0
        }));

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// ================================
// GET PRODUCT BY ID
// ================================

app.get("/products/:id", async (req, res) => {

    try {

        const id = Number(req.params.id);

        const product = await products.findOne({
            id: id
        });

        if (!product) {

            return res.json({
                success: false,
                message: "Produk tidak ditemukan"
            });

        }

        res.json({
            success: true,
            data: {
                id: String(product.id),
                nama_produk: product.nama_produk,
                tautan: product.tautan,
                deskripsi: product.deskripsi,
                pin: Number(product.pin) || 0
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// ================================
// CREATE
// ================================

app.post("/products", async (req, res) => {

    try {

        const {
            nama_produk,
            tautan,
            deskripsi
        } = req.body;

        if (!nama_produk) {

            return res.json({
                success: false,
                message: "nama_produk wajib diisi"
            });

        }

        const lastProduct = await products
            .find({})
            .sort({ id: -1 })
            .limit(1)
            .toArray();

        const id =
            lastProduct.length > 0
                ? Number(lastProduct[0].id) + 1
                : 1;

        const product = {

            id: id,

            nama_produk:
                nama_produk || "",

            tautan:
                tautan || "",

            deskripsi:
                deskripsi || "",

            pin: 0

        };

        await products.insertOne(product);

        res.json({
            success: true,
            message: "Produk berhasil ditambahkan",
            data: {
                id: String(product.id),
                nama_produk: product.nama_produk,
                tautan: product.tautan,
                deskripsi: product.deskripsi,
                pin: product.pin
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// ================================
// UPDATE
// ================================

app.put("/products/:id", async (req, res) => {

    try {

        const id = Number(req.params.id);

        const oldProduct =
            await products.findOne({
                id: id
            });

        if (!oldProduct) {

            return res.json({
                success: false,
                message: "Produk tidak ditemukan"
            });

        }

        const updateData = {

            nama_produk:
                req.body.nama_produk || "",

            tautan:
                req.body.tautan || "",

            deskripsi:
                req.body.deskripsi || ""

        };

        if (
            req.body.pin !== undefined &&
            req.body.pin !== null
        ) {

            updateData.pin =
                Number(req.body.pin) === 1 ? 1 : 0;

        } else {

            updateData.pin =
                Number(oldProduct.pin) || 0;

        }

        await products.updateOne(
            { id: id },
            { $set: updateData }
        );

        res.json({
            success: true,
            message: "Produk berhasil diupdate",
            data: {
                id: String(id),
                nama_produk: updateData.nama_produk,
                tautan: updateData.tautan,
                deskripsi: updateData.deskripsi,
                pin: updateData.pin
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// ================================
// PIN / UNPIN
// ================================

app.put("/products/:id/pin", async (req, res) => {

    try {

        const id = Number(req.params.id);

        const pin =
            Number(req.body.pin) === 1 ? 1 : 0;

        const result =
            await products.updateOne(
                { id: id },
                {
                    $set: {
                        pin: pin
                    }
                }
            );

        if (result.matchedCount === 0) {

            return res.json({
                success: false,
                message: "Produk tidak ditemukan"
            });

        }

        res.json({
            success: true,

            message:
                pin === 1
                    ? "Produk berhasil dipin"
                    : "Produk berhasil di-unpin",

            data: {
                id: String(id),
                pin: pin
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// ================================
// DELETE
// ================================

app.delete("/products/:id", async (req, res) => {

    try {

        const id = Number(req.params.id);

        const result =
            await products.deleteOne({
                id: id
            });

        if (result.deletedCount === 0) {

            return res.json({
                success: false,
                message: "Produk tidak ditemukan"
            });

        }

        res.json({
            success: true,
            message: "Produk berhasil dihapus"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// ================================
// START SERVER
// ================================

connectMongoDB()
    .then(() => {

        app.listen(PORT, "0.0.0.0", () => {

            console.log(
                `Server berjalan di port ${PORT}`
            );

        });

    })
    .catch(error => {

        console.error(
            "Gagal konek MongoDB:",
            error
        );

    });