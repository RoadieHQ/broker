const fs = require('fs');
const path = require('path');
const camelcase = require('camelcase');

const { loadConfig } = require('snyk-config');
const config = loadConfig(__dirname + '/..');

function camelify(res) {
  return Object.keys(res).reduce((acc, _) => {
    acc[camelcase(_)] = res[_];
    acc[_] = res[_];
    return acc;
  }, {});
}

function isEnvVarContainingPassword(envVarName) {
  const enVarsContainingPasswords = [
    'PASSWORD',
    'BROKER_CLIENT_VALIDATION_AUTHORIZATION_HEADER',
    'BROKER_CLIENT_VALIDATION_BASIC_AUTH',
  ];
  return enVarsContainingPasswords.some((v) => envVarName.includes(v));
}

function expandValue(obj, value) {
  return value.replace(/([\\]?\$.+?\b)/g, (all, key) => {
    if (key[0] === '$') {
      key = key.slice(1);
      return obj[key] || '';
    }

    return key;
  });
}

function expand(obj) {
  const keys = Object.keys(obj);

  for (const key of keys) {
    if (!isEnvVarContainingPassword(key)) {
      const value = expandValue(obj, obj[key]);
      if (value !== obj[key]) {
        obj[key] = value;
      }
    }
  }

  return obj;
}

// allow the user to define their own configuration
const dotenv = require('dotenv');

dotenv.config({
  silent: true,
  path: process.cwd() + '/.env',
});

expand(process.env);

const res = Object.assign({}, camelify(config), camelify(process.env));

if (res.caCert) {
  res.caCert = fs.readFileSync(path.resolve(process.cwd(), res.caCert));
}

module.exports = res;
