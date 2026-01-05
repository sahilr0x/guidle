import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";

export function createServer(port:number) {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get("/health", (req, res) => {
        res.status(200).send("OK");
    });

    app.use("intent",intentRouter);

    const server = app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });


    const wss = new WebSocketServer({ server });
    wss.on("connection", handleSession)

}