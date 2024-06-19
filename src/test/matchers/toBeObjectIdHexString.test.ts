import { describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";
import stringToObjectId from "../../helpers/stringToObjectId";
import objectIdToString from "../../helpers/objectIdToString";

// Commentary:
// It's important to test our tests!

describe('toBeObjectId', () => {
  test('hex string is an objectId hex string', () => {
    expect('6672272d1b68e1f478bb698c').toBeObjectIdHexString();
  });

  test('actually incorrect but facially valid hex string is an objectId hex string', () => {
    // Even though this example is likely not valid in any real
    // use case, it does facially appear to be an objectId and
    // so should be expected to pass
    expect('aaaaaaaaaaaaaaaaaaaaaaaa').toBeObjectIdHexString();
  });

  test('empty string is not an objectId hex string', () => {
    expect('').not.toBeObjectIdHexString();
  });

  test('empty object is not an objectId hex string', () => {
    expect({}).not.toBeObjectIdHexString();
  });

  test('null is not an objectId hex string', () => {
    expect(null).not.toBeObjectIdHexString();
  });

  test('0 is not an objectId hex string', () => {
    expect(0).not.toBeObjectIdHexString();
  });

  test('number that is a valid hex string but incorrect type is not an objectId hex string', () => {
    // if the following were a string, it WOULD be valid
    expect(667227221368411478556985).not.toBeObjectIdHexString();
  });

  test('number as string that is a valid hex string but not correct type is an objectId hex string', () => {
    // Test the previous number but as a string and it should pass
    expect('667227221368411478556985').toBeObjectIdHexString();
  });

  test('actual objectIds are not a valid objectId hex string', () => {
    expect(new mongoose.Types.ObjectId()).not.toBeObjectIdHexString();
    expect(new mongoose.Types.ObjectId().toHexString()).toBeObjectIdHexString();
    expect(new mongoose.Types.ObjectId('6672272d1b68e1f478bb698c')).not.toBeObjectIdHexString();
    expect(new mongoose.Types.ObjectId('6672272d1b68e1f478bb698c').toHexString()).toBeObjectIdHexString();
  });

  // test our conversion functions
  test('stringToObjectId works with valid hex strings', () => {
    expect(stringToObjectId('6672272d1b68e1f478bb698c')).not.toBeObjectIdHexString();
    expect(stringToObjectId('6672272d1b68e1f478bb698c').toHexString()).toBeObjectIdHexString();
  });
  test('objectIdToString works with valid hex strings', () => {
    expect(objectIdToString(new mongoose.Types.ObjectId())).toBeObjectIdHexString();
    expect(objectIdToString(new mongoose.Types.ObjectId('6672272d1b68e1f478bb698c'))).toBeObjectIdHexString();
  });
});