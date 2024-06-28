const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
//const date = require(__dirname + '/date.js');
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.set('view engine', 'ejs');

//mongoose.connect('mongodb://localhost:27017/itemsDB');
mongoose.connect('mongodb+srv://kdc392:<PASSWORD>@cs-312.1old5sc.mongodb.net/itemsDB');

const itemsSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item ({
  name: 'Click the + to add items'
});
const item2 = new Item ({
  name: '<-- Click the checkbox to cross out items'
});
const item3 = new Item ({
  name: '<-- Double click the checkbox to delete all crossed out items'
});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

app.get('/', function(req, res){
  //let day = date.getDate();
  Item.find({}).then(function(foundItems){

    console.log('Found Items Size:', foundItems.length);

    if (foundItems.length === 0) {

      Item.insertMany(defaultItems);
      console.log('Defaults Created');
      res.redirect('/');
    } else {

      console.log('Found Items:', foundItems);
      res.render('list', {listTitle: 'Today', newListItems: foundItems});
    };
  }).catch(function (err) {
  console.log(err);
  });
});

app.post('/', function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if(listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}).then(function(foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    }).catch(function(err){
      console.log(err);
    });
  };

});

app.post('/delete', function(req, res){
  const checkedID = req.body.checkBox;
  const listName = req.body.listName;

  if (listName === 'Today'){
    Item.findByIdAndDelete(checkedID).then(function(err){
      if(!err){
        console.log('deleted');
        res.redirect('/');
      };
    }).catch(function(err){
      console.log(err);
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedID}}}).then(function(foundList){
      res.redirect('/' + listName);
    }).catch(function(err){
      console.log(err);
    });
  };

});

//dynamic routing
app.get('/:customListName', function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then(function(foundList){
    if(!foundList) {
      //console.log('Does not exist, Creating list');
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect('/' + customListName);
    } else {
      //console.log('Showing List');
      res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
    };
  }).catch(function(err){
    console.log(err);
  });
});

app.get('/about', function(req, res){
  res.render('about');
});


let port = process.env.PORT;
if (port == null || port == ''){
  port = 3000;
};

app.listen(port, function(){
  console.log('Server has started');
});
