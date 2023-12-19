const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
// const PORT = 5000
const MONGO_URL = 'mongodb+srv://manianil8423:Anil&2000@cluster0.zbzvvqo.mongodb.net/crud?retryWrites=true&w=majority'
mongoose.connect(MONGO_URL).then(() => {
    console.log("mongoose connected successfully")

    app.listen(PORT, () => {
        console.log(`server is running on port: ${PORT}`)
    })
}).catch(error => console.log(error));


const StaffModel = mongoose.model('Staff', {
    name: String,
    availability: Boolean,
    workingHours: Array,
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
});

const OrderModel = mongoose.model('Order', {
    items: { name: String, quantity: Number },
    customerName: String,
    deliveryAddress: String,
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    orderTime: { type: Date, default: Date.now },
    estimatedDeliveryTime: { type: Date },
});

app.post('/api/staff', async (req, res) => {
    try {
        const { name, availability, workingHours } = req.body;
        const staff = new StaffModel({ name, availability, workingHours });
        await staff.save();
        res.json(staff);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/staff', async (req, res) => {
    try {
        const staffList = await StaffModel.find();
        res.json(staffList);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/staff/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, availability, workingHours } = req.body;
        const updatedStaff = await StaffModel.findByIdAndUpdate(id, { name, availability, workingHours }, { new: true });
        res.json(updatedStaff);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/staff/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await StaffModel.findByIdAndDelete(id);
        res.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/api/order', async (req, res) => {
    try {
        const { items, customerName, deliveryAddress } = req.body;
        const order = new OrderModel({
            items: { name: items[0], quantity: items[1] },
            customerName,
            deliveryAddress,
            estimatedDeliveryTime: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes from now
        });

        // Find an available staff member to assign to the order
        const availableStaff = await StaffModel.findOne({ availability: true });
        if (!availableStaff) {
            return res.status(400).json({ error: 'No available staff for delivery' });
        }

        order.deliveryPartner = availableStaff._id;
        const id = availableStaff._id
        const name = availableStaff.name
        const availability = false
        const workingHours = []
        availableStaff.orders.push(order._id);
        await StaffModel.findByIdAndUpdate(id, { name, availability, workingHours }, { new: true });
        await Promise.all([order.save(), availableStaff.save()]);

        res.json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/api/order', async (req, res) => {
    try {
        const orderList = await OrderModel.find().populate('deliveryPartner', 'name');
        res.json(orderList);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
