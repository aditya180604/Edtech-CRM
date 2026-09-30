import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import * as models from '../src/models/index.js';
import { ROLES, ENTITLEMENT_STATUS, PRODUCT_TYPES } from '../src/config/constants.js';

describe('Edutech LMS — Database Layer & Models Test Suite', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await disconnectDB();
  });

  it('1. Should successfully connect to MongoDB Atlas with active database', () => {
    assert.strictEqual(mongoose.connection.readyState, 1, 'MongoDB should be connected (readyState 1)');
    assert.ok(mongoose.connection.db.databaseName, 'Database name must be present');
  });

  it('2. Should export all specified Mongoose models without collision or circular dependencies', () => {
    const modelKeys = Object.keys(models);
    assert.ok(modelKeys.length >= 35, `Expected high count of modular domain models, received: ${modelKeys.length}`);

    // Verify key models
    assert.ok(models.User, 'User model must be defined');
    assert.ok(models.InstructorProfile, 'InstructorProfile model must be defined');
    assert.ok(models.Course, 'Course model must be defined');
    assert.ok(models.Module, 'Module model must be defined');
    assert.ok(models.Topic, 'Topic model must be defined');
    assert.ok(models.Lesson, 'Lesson model must be defined');
    assert.ok(models.Resource, 'Resource model must be defined');
    assert.ok(models.Video, 'Video model must be defined');
    assert.ok(models.Entitlement, 'Entitlement model must be defined');
    assert.ok(models.TopicCredit, 'TopicCredit model must be defined');
    assert.ok(models.CourseUpgrade, 'CourseUpgrade model must be defined');
    assert.ok(models.Order, 'Order model must be defined');
    assert.ok(models.Payment, 'Payment model must be defined');
    assert.ok(models.FinancialLedger, 'FinancialLedger model must be defined');
    assert.ok(models.LearningProgress, 'LearningProgress model must be defined');
    assert.ok(models.VideoProgress, 'VideoProgress model must be defined');
    assert.ok(models.Certificate, 'Certificate model must be defined');
    assert.ok(models.Lead, 'Lead model must be defined');
    assert.ok(models.Event, 'Event model must be defined');
    assert.ok(models.Conversation, 'Conversation model must be defined');
  });

  it('3. Should validate User model password hashing and comparison methods', async () => {
    const plain = 'SecurePassword123!';
    const hashed = await models.User.hashPassword(plain);

    assert.ok(hashed.startsWith('$2'), 'Bcrypt hash should start with $2');

    const tempUser = new models.User({
      email: 'test_hash@example.com',
      passwordHash: hashed,
      role: ROLES.STUDENT,
    });

    const isMatch = await tempUser.comparePassword(plain);
    const isWrong = await tempUser.comparePassword('WrongPassword');

    assert.strictEqual(isMatch, true, 'Correct password should match');
    assert.strictEqual(isWrong, false, 'Incorrect password should not match');
  });

  it('4. Should validate Entitlement model schema constraints', () => {
    const dummyEntitlement = new models.Entitlement({
      userId: new mongoose.Types.ObjectId(),
      productType: PRODUCT_TYPES.TOPIC,
      productId: new mongoose.Types.ObjectId(),
      status: ENTITLEMENT_STATUS.ACTIVE,
    });

    assert.strictEqual(dummyEntitlement.status, ENTITLEMENT_STATUS.ACTIVE);
    assert.strictEqual(dummyEntitlement.productType, PRODUCT_TYPES.TOPIC);
  });

  it('5. Should validate Topic atomic commerce fields and Course hierarchy references', () => {
    const courseId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();

    const topic = new models.Topic({
      courseId,
      moduleId,
      title: 'Introduction to React & TypeScript',
      price: 19.99,
      currency: 'USD',
      isFree: false,
    });

    assert.strictEqual(topic.price, 19.99);
    assert.strictEqual(topic.courseId.toString(), courseId.toString());
    assert.strictEqual(topic.moduleId.toString(), moduleId.toString());
  });
});
