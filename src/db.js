import mongo from "mongodb";
let connection_string = "mongodb+srv://admin:admin@cluster0-afxcf.mongodb.net/<dbname>?retryWrites=true&w=majority";
let client = new mongo.MongoClient(connection_string, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
let db = null
export default () => {
    return new Promise((resolve, reject) => {
        if (db && client.isConnected()) {
            resolve(db)
        }
        else {
            client.connect(err => {
                if (err) {
                    reject("Database connection failed:" + err);
                }
                else {
                    console.log("Database connected successfully!");
                    db = client.db("YouLearn");
                    resolve(db);
                }
            });
        }
    });
}