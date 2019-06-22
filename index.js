require('dotenv').config();

const express = require('express');
const snmp = require('net-snmp');
const joi = require('joi');
const timeout = require('await-timeout');
const { promisifyAll } = require('bluebird');
const cors = require('cors');

const app = express();

app.use(express.json());

const schema = () => joi.object({
  host: joi.string().required(),
  community: joi.string().required(),
  oid: joi.string().required(),
  interval: joi.number().required(),
  times: joi.number().min(1),
  minLimit: joi.number().min(0),
  maxLimit: joi.number().min(0),
  instance: joi.number().min(0),
  port: joi.number(),
});

const validate = (req, res, next) => {
  const { error } = joi.validate(req.body, schema());

  if (error) {
    res.send(error);
  }

  next();
};

app.use(cors());

app.use('/', validate, async (req, res) => {
  const {
    host,
    community,
    oid,
    interval,
    times,
    minLimit,
    maxLimit,
    instance = 0,
    port,
  } = req.body;

  const options = {
    port,
  };

  const session = promisifyAll(snmp.createSession(host, community, options));
  const formattedOid = `${oid}.${instance}`;

  /* eslint-disable no-shadow */
  const consult = async (turns, oid, session) => {
    /* eslint-disable no-plusplus */
    /* eslint-disable no-await-in-loop */
    const datas = [];

    for (let i = 0; i < turns; i++) {
      await session
        .getAsync([oid])
        .then(async ([response]) => {
          datas.push(response);
          await timeout.set(interval);
        })
        .catch(err => res.status(404).send(err));
    }

    return datas;
  };

  const formatResponse = datas => datas.map((data, index) => {
    const formatValue = index > 0 ? data.value - datas[index - 1].value : 0;
    const alert = index > 0 ? formatValue > maxLimit || formatValue < minLimit : false;

    return {
      ...data,
      formatValue,
      alert,
      time: `${index * (interval / 1000)}s`,
    };
  });

  let datas;

  if (oid === 'LINK') {
    const ifIn = await consult(times, `1.3.6.1.2.1.2.2.1.10.${instance}`, session);
    const formatIfIn = formatResponse(ifIn);

    const ifOut = await consult(times, `1.3.6.1.2.1.2.2.1.16.${instance}`, session);
    const formatIfOut = formatResponse(ifOut);

    const ifSpeed = await session.getAsync([`1.3.6.1.2.1.2.2.1.16.${instance}`]);
    const link = [];

    /* eslint-disable no-plusplus */
    for (let i = 0; i < times; i++) {
      const toPush = ((formatIfIn[i].formatValue + formatIfOut[i].formatValue) * 8) / ifSpeed[0].value;

      link.push({ formatValue: toPush, time: `${i * (interval / 1000)}s` });
    }

    datas = link;
  } else {
    datas = await consult(times, formattedOid, session);
  }

  session.close();
  res.send(datas);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  /* eslint-disable no-console */
  console.log(`Server started on port ${PORT}`);
});
