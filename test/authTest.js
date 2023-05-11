const chai = require('chai');
const chaiHttp = require('chai-http');
const User = require("../models/User");
const asyncHandler = require("../middlewares/async");
const app = require("../app");
const server = require("../server");
chai.use(chaiHttp);
const apiUrl = 'http://localhost:8000/api/v1'

describe('Authentication tests', () => {
    let server;
    //Drop users so we can have a clean env before testing
    before(async () => {
        before((done) => {
            server = app.listen(3000, () => {
                console.log('Server started');
                done();
            });
        });

        await User.removeAllUsers();
    })
    /**
     * Test the REGISTER route
     */
    describe('Register user', () => {
        //Test if the endpoint returns a 201 status code for a valid request.
        it('should return a 201 status code for a valid request', (done) => {
            chai.request(apiUrl)
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'Testpa$$word123',
                    role: 'user',
                    photo: null,
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(201);
                    done();
                });
        });
        // Test if the endpoint returns a 400 status code if the email is missing.
        it('should return a 400 status code if email is missing', (done) => {
            chai.request(apiUrl)
                .post('/auth/register')
                .send({
                    password: 'Testpa$$word123',
                    role: 'user',
                    photo: null,
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });
        // Test if the endpoint returns a 400 status code if the email is invalid.
        it('should return a 400 status code if email is invalid', (done) => {
            chai.request(apiUrl)
                .post('/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'Testpa$$word123',
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });
        // Test if the endpoint returns a 400 status code if the password is missing.
        it('should return a 400 status code if password is missing', (done) => {
            chai.request(apiUrl)
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    role: 'user',
                    photo: null,
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });
        // Test if the endpoint returns a 400 status code if the password is too short.
        it('should return a 400 status code if password is too short', (done) => {
            chai.request(apiUrl)
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'aaa',
                    role: 'user',
                    photo: null,
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });
        // Test if the endpoint returns a 400 status code if the password is not strong enough.
        it('should return a 400 status code if password is not strong enough', (done) => {
            chai.request(apiUrl)
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'invalidpassword',
                    role: 'user',
                    photo: null,
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(400);
                    done();
                });
        });
    })
})


//EXAMPLE
// describe('{ENDPOINT CATEGORY}', () => {
//     describe('{DESCRIBE THE ENDPOINT}', () => {
//         it('WHAT SHOULD DO, EX: should return an array of users', (done) => {
//             chai.request(apiUrl)
//                 .get('{ENDPOINT}')
//                 .end((err, res) => {
//                     expect(err).to.be.null;
//                     expect(res).to.have.status(401);
//                     expect(res.body.success).to.be.false;
//                     done();
//                 });
//         });
//     });
// })


const expect = chai.expect;