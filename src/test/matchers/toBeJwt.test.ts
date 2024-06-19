import { describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";

// Decoded looks like
// {"alg":"HS256","typ":"JWT"}{"sub":"6672b6614e46aee1dfbb93dd","roles":["admin"],"iat":1718793825,"exp":1718822625,"aud":"koans.example.com","iss":"api.koans.example.com"}
const jwtWithAdminRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjcyYjY2MTRlNDZhZWUxZGZiYjkzZGQiLCJyb2xlcyI6WyJhZG1pbiJdLCJpYXQiOjE3MTg3OTM4MjUsImV4cCI6MTcxODgyMjYyNSwiYXVkIjoia29hbnMuZXhhbXBsZS5jb20iLCJpc3MiOiJhcGkua29hbnMuZXhhbXBsZS5jb20ifQ.WIxV1aCa3DXdo-CMaJOyjvWzmbg7Ph_Mk3sMASU_bYI';

// Decoded looks like
// {"alg":"HS256","typ":"JWT"}{"sub":"6672b6614e46aee1dfbb93da","iat":1718793825,"exp":1718822625,"aud":"koans.example.com","iss":"api.koans.example.com"}
const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjcyYjY2MTRlNDZhZWUxZGZiYjkzZGEiLCJpYXQiOjE3MTg3OTM4MjUsImV4cCI6MTcxODgyMjYyNSwiYXVkIjoia29hbnMuZXhhbXBsZS5jb20iLCJpc3MiOiJhcGkua29hbnMuZXhhbXBsZS5jb20ifQ.9Z9Rlp9hAD9CniarRPQYOmRoSjz-TTNWbS2YJjje_lQ';

// Commentary:
// It's important to test our tests!

describe('toBeObjectId', () => {
  test('valid jwt', () => {
    expect(jwt).toBeJwt();
  });

  test('valid jwt with roles', () => {
    expect(jwtWithAdminRole).toBeJwt();
  });

  test('empty string is not valid', () => {
    expect('').not.toBeJwt();
  });

  test('random string is not valid', () => {
    expect('asdasdaasd;aojcwpacojsd').not.toBeJwt();
  })

  test('object is not jwt', () => {
    expect({}).not.toBeJwt();
  });

  test('number is not jwt', () => {
    expect(13910958).not.toBeJwt();
  });

  test('null is not jwt', () => {
    expect(null).not.toBeJwt();
  });

  test('undefined is not jwt', () => {
    expect(undefined).not.toBeJwt();
  });
});