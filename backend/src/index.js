const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 8000;


app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true,               
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api', routes);

app.listen(8000, () => {
  console.log(`Server is runing! http://localhost:${port}`);

});

