const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js"); //this is npm install, we will use special command to require date.js to use in app.js
const mongoose = require("mongoose");
const { render } = require("ejs");
const _ = require("lodash");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = [];
// const workItems = [];
// Use MongoDB and Mongoose instead to create database
const mongoURI =
  "mongodb+srv://mchmachima:h1wsTrSH08@todolistdb.muwc5ry.mongodb.net/";
mongoose.connect(mongoURI); // Connect to MongoDB

// Create Schema
const itemsSchema = {
  name: String,
};
// Create Model
const Item = mongoose.model("Item", itemsSchema);
// Add defalt data in database
const item1 = new Item({
  name: "clean room",
});
const item2 = new Item({
  name: "buy fruit",
});
const item3 = new Item({
  name: "read book",
});

const defaltItems = [item1, item2, item3];
// Item.insertMany(defaltItems)
//   .then(function () {
//     console.log("Successfully add items");
//   })
//   .catch(function (err) {
//     console.log(err);
//   });

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("list", listSchema);

//use view engine to ejs (use with express)
app.set("view engine", "ejs");

//add date header
app.get("/", function (request, response) {
  // const day = date.getDate(); //call function from date.js (module.function)

  // Add Item to database
  // Model.find() save array so that why we should check if item.length === 0
  Item.find({})
    .then(function (item) {
      if (item.length === 0) {
        Item.insertMany(defaltItems)
          .then(function () {
            console.log("Successfully add items");
          })
          .catch(function (err) {
            console.log(err);
          });
        response.redirect("/");
      } else {
        response.render("list", { listTitle: "Today", newListItems: item });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

//when add to-do list on webpage, will parse to server
app.post("/", function (request, response) {
  const itemName = request.body.newItem;
  const listName = request.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    newItem.save().then(() => {
      console.log("Successfully add a new item");
    });
    response.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(newItem);
        // console.log(newItem);
        foundList.save();
        response.redirect(`/${listName}`);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

// Dynamic route
app.get("/:customListName", function (request, response) {
  const customListName = _.capitalize(request.params.customListName);

  // Model.findOne save object, we can use !foundList
  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaltItems,
        });
        list.save().then(() => {
          console.log("Already saved a new list");
        });
        response.redirect(`/${customListName}`);
      } else {
        // Show an existing list
        response.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

// Delete items when checked on checkbox
app.post("/delete", function (request, response) {
  const checkedItem = request.body.checkbox;
  const listName = request.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItem)
      .then(() => {
        console.log("Successfully deleted checkbox item");
        response.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItem } } }
    )
      .then(() => {
        response.redirect(`/${listName}`);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
