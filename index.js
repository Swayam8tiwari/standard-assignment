const express = require('express');
const paypal = require('paypal-rest-sdk'); 
const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/test');
} 

const PORT = process.env.PORT || 3000 ;
paypal.configure({
  'mode': 'live', //sandbox or live
  'client_id': 'AeDMnnzkW7XCxzYXT35LQgrMeQqCYlshIkVphmqlDcjQkWXPSYCe7noGn9_O8p4QiYEnd4neC0ivNkrS',
  'client_secret': 'EB3nHiBEQFt0i27-5HAjeF_A66eN3lryJAiT-hD7aD-FH-PrVfKEaHyBXqB-oViNS4MQsH-Ba-4xxil5'
}); 
var v;
var Schema = mongoose.Schema;  
var paymentSchema = new Schema({},{strict:false});
var history = mongoose.model('history', paymentSchema);
const app = express(); 
app.use(express.urlencoded({ extended: true}));
app.post('/pay', (req, res) => {  
  const a =  req.body.amount; 
  v=a;
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success",
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Red Sox Hat",
                "sku": "001",
                "price": a,
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": a
        },
        "description": "Hat for the best team ever"
    }]
}; 
paypal.payment.create(create_payment_json, function (error, payment) {
  if (error) {
      throw error;
  } else {
      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
          res.redirect(payment.links[i].href);
        }
      }
  }
});

}); 
app.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const a= v;
  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": a
        }
    }]
  }; 

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) { 
      const data = new history(error.response); 
      data.save().then(()=> { 
        console.log("saved");
      }).catch(()=>{ -
        console.log("not saved");
      });
        console.log(error.response);
        throw error;
    } else { 
      const data = new history(payment); 
      data.save().then(()=> { 
        console.log("saved");
      }).catch(()=>{ -
        console.log("not saved");
      });
        console.log(JSON.stringify(payment));
        res.send('Success');
    }
});
}); 
app.get('/cancel', (req, res) => res.send('Cancelled'));
app.get('/', (req, res) => res.sendFile(__dirname + "/index.html"));


app.listen(PORT, () => console.log(`Server Started on ${PORT}`));