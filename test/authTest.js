const chai = require('chai');
const chaiHttp = require('chai-http');
const User = require("../models/User");
const asyncHandler = require("../middlewares/async");
const app = require("../app");
const server = require("../server");
chai.use(chaiHttp);
const apiUrl = 'http://localhost:8000/api/v1'

//IMPORTANT: always run tests on testing
if(process.env.NODE_ENV !== 'testing'){
    return 'Env is not set to testing'
}

describe('Authentication tests', () => {
    let user = {}
    let token;
    user.password = 'Testpa$$word123';

    //Drop users so we can have a clean env before testing
    before(async () => {
        await User.removeAllUsers();
    });
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
                    password: user.password,
                    role: 'user',
                    photo: null,
                })
                .end((err, res) => {
                    user = res.body.data;
                    expect(err).to.be.null;
                    expect(res).to.have.status(201);
                    done();
                });
        });
        //Test if the endpoint returns a 201 status code for a valid request.
        it('should return a 400 status code if email is already used', (done) => {
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
                    expect(res).to.have.status(400);
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

    describe('Login user', () => {
        //Test if the endpoint returns a 201 status code for a valid login request.
        it('should return a 201 status code for a valid login request', (done) => {
            chai.request(apiUrl)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: user.password,
                    role: 'user',
                    photo: null,
                })
                .end((err, res) => {
                    user = res.body.data;
                    expect(err).to.be.null;
                    expect(res).to.have.status(201);
                    done();
                });
        });
        //Test if the endpoint returns a 404 status code for an invalid email.
        it('should return a 404 status code for an invalid email', (done) => {
            chai.request(apiUrl)
                .post('/auth/login')
                .send({
                    email: 'invalid@example.com',
                    password: user.password,
                    role: 'user',
                    photo: null,
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(404);
                    done();
                });
        });

        //Test if the endpoint returns a 401 status code for an invalid password.
        it('should return a 401 status code for an invalid password', (done) => {
            chai.request(apiUrl)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'invalidPassword',
                    role: 'user',
                    photo: null,
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(401);
                    done();
                });
        });

        //Test if the endpoint returns a JWT token for a valid login request.
        it('should return a JWT token for a valid login request', (done) => {
            chai.request(apiUrl)
                .post('/auth/login')
                .send({
                    email: user.email,
                    password: user.password,
                    role: 'user',
                    photo: null,
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('authToken');
                    token = res.body.data.authToken
                    done();
                });
        });

        //Test if the endpoint returns the correct user object for a valid login request.
        it('should return the correct user object for a valid login request', (done) => {
            chai.request(apiUrl)
                .post('/auth/login')
                .send({
                    email: user.email,
                    password: user.password,
                    role: 'user',
                    photo: null,
                })
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.have.property('email', 'test@example.com');
                    expect(res.body.data).to.not.have.property('password');
                    expect(res.body.data).to.not.have.property('authTokens');
                    done();
                });
        });


    })
})


const expect = chai.expect;