require('dotenv').config();

const express = require('express');
const snmp = require('net-snmp');
const joi = require('joi');
const timeout = require('await-timeout');
const { promisifyAll } = require('bluebird');

const app = express();

app.use(express.json());

const schema = () => joi.object({
  host: joi.string().required(),
  community: joi.string().required(),
  oid: joi.string().required(),
  interval: joi.number().required(),
  times: joi.number().min(3),
  minLimit: joi.number().min(1),
  maxLimit: joi.number(),
});

const validate = (req, res, next) => {
  const { error } = joi.validate(req.body, schema());

  if (error) {
    res.send(error);
  }

  next();
};

app.use('/', validate, async (req, res) => {
  const {
    host, community, oid, interval, times = 5, minLimit, maxLimit,
  } = req.body;

  const session = promisifyAll(snmp.createSession(host, community));
  const datas = [];

  /* eslint-disable no-plusplus */
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < times; i++) {
    await session
      .getAsync([oid])
      .then(async ([response]) => {
        datas.push(response);
        await timeout.set(interval);
      })
      .catch(err => res.status(404).send(err));
  }

  const response = datas.map((data, index) => {
    const formatValue = index > 0 ? data.value - datas[index - 1].value : 0;
    const alert = index > 0 ? formatValue > maxLimit || formatValue < minLimit : false;

    return {
      ...data,
      formatValue,
      alert,
      time: `${index * (interval / 1000)}s`,
    };
  });

  session.close();
  res.send(response);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  /* eslint-disable no-console */
  console.log(`Server started on port ${PORT}`);
});
