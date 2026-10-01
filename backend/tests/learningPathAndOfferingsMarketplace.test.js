import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  Course,
  Module,
  Topic,
  Lesson,
  TopicContentOffering,
  LearningPath,
  LearningPathDomain,
  LearningPathDomainTopic,
  Entitlement,
  Order,
  OrderItem,
  Payment,
  InstructorEarning,
} from '../src/models/index.js';
import { LearningPathService } from '../src/modules/learningPaths/learningPath.service.js';
import { PRODUCT_TYPES, ENTITLEMENT_STATUS } from '../src/config/constants.js';

describe('Industry-Grade Dynamic Learning Path + Domain + Topic + Tutor Marketplace Suite', () => {
  let studentUser;
  let tutorA;
  let tutorB;
  let tutorC;
  let course;
  let moduleDoc;
  let topicDoc;
  let offeringA;
  let offeringB;
  let offeringC;
  let lessonA;
  let lessonB;
  let lessonC;
  let learningPath;
  let domainDoc;

  before(async () => {
    await connectDB();

    // Setup test users
    const timestamp = Date.now();
    studentUser = await User.create({
      email: `student_market_${timestamp}@test.com`,
      passwordHash: 'dummy_hash',
      role: 'STUDENT',
      firstName: 'Alex',
      lastName: 'Learner',
    });

    tutorA = await User.create({
      email: `tutorA_${timestamp}@test.com`,
      passwordHash: 'dummy_hash',
      role: 'INSTRUCTOR',
      firstName: 'Sarah',
      lastName: 'Connor',
    });

    tutorB = await User.create({
      email: `tutorB_${timestamp}@test.com`,
      passwordHash: 'dummy_hash',
      role: 'INSTRUCTOR',
      firstName: 'David',
      lastName: 'Miller',
    });

    tutorC = await User.create({
      email: `tutorC_${timestamp}@test.com`,
      passwordHash: 'dummy_hash',
      role: 'INSTRUCTOR',
      firstName: 'Elena',
      lastName: 'Rostova',
    });

    // Create course, module, topic
    course = await Course.create({
      title: `AI & Machine Learning Masterclass ${timestamp}`,
      slug: `ai-ml-masterclass-${timestamp}`,
      instructorId: tutorA._id,
      category: 'Artificial Intelligence',
      status: 'PUBLISHED',
      coursePrice: 4999,
    });

    moduleDoc = await Module.create({
      courseId: course._id,
      title: 'Generative AI & LLM Systems',
      order: 1,
      status: 'PUBLISHED',
    });

    topicDoc = await Topic.create({
      courseId: course._id,
      moduleId: moduleDoc._id,
      title: 'Retrieval-Augmented Generation (RAG)',
      slug: `rag-systems-${timestamp}`,
      description: 'Comprehensive subject covering embedding models, vector search, and rerankers.',
      difficulty: 'INTERMEDIATE',
      skills: ['RAG', 'Vector DBs', 'Embeddings', 'LangChain'],
      status: 'PUBLISHED',
      price: 999, // Legacy fallback price - must not override offering prices
    });

    // Create 3 Independent Tutor Content Offerings with distinct prices
    offeringA = await TopicContentOffering.create({
      offeringId: `OFF-A-${timestamp}`,
      topicId: topicDoc._id,
      courseId: course._id,
      instructorId: tutorA._id,
      title: 'RAG Fundamentals & Quickstart',
      slug: `rag-fundamentals-${timestamp}`,
      price: 799, // Authoritative price
      currency: 'INR',
      status: 'PUBLISHED',
      durationMinutes: 90,
      skills: ['RAG Basics', 'Embeddings'],
    });

    offeringB = await TopicContentOffering.create({
      offeringId: `OFF-B-${timestamp}`,
      topicId: topicDoc._id,
      courseId: course._id,
      instructorId: tutorB._id,
      title: 'RAG with LangChain & LlamaIndex',
      slug: `rag-langchain-${timestamp}`,
      price: 999, // Authoritative price
      currency: 'INR',
      status: 'PUBLISHED',
      durationMinutes: 140,
      skills: ['LangChain', 'LlamaIndex'],
    });

    offeringC = await TopicContentOffering.create({
      offeringId: `OFF-C-${timestamp}`,
      topicId: topicDoc._id,
      courseId: course._id,
      instructorId: tutorC._id,
      title: 'Production RAG: Hybrid Search & Advanced Reranking',
      slug: `production-rag-${timestamp}`,
      price: 1499, // Authoritative price
      currency: 'INR',
      status: 'PUBLISHED',
      durationMinutes: 210,
      skills: ['Hybrid Search', 'Cross-Encoders', 'Reranking'],
    });

    // Create Lessons for each offering
    lessonA = await Lesson.create({
      topicId: topicDoc._id,
      contentOfferingId: offeringA._id,
      title: 'Lesson A1: Introduction to RAG Architecture',
      duration: 1200,
      order: 1,
      status: 'PUBLISHED',
      isFreePreview: true,
      playbackReference: 'stream_a1.m3u8',
    });

    lessonB = await Lesson.create({
      topicId: topicDoc._id,
      contentOfferingId: offeringB._id,
      title: 'Lesson B1: LangChain Pipeline Setup',
      duration: 1800,
      order: 1,
      status: 'PUBLISHED',
      isFreePreview: false,
      playbackReference: 'stream_b1.m3u8',
    });

    lessonC = await Lesson.create({
      topicId: topicDoc._id,
      contentOfferingId: offeringC._id,
      title: 'Lesson C1: Production Vector Indexing & Hybrid Search',
      duration: 2400,
      order: 1,
      status: 'PUBLISHED',
      isFreePreview: false,
      playbackReference: 'stream_c1.m3u8',
    });

    // Create Learning Path & Domain Hierarchy
    learningPath = await LearningPath.create({
      title: `AI Architect Track ${timestamp}`,
      slug: `ai-architect-${timestamp}`,
      description: 'The definitive roadmap for modern AI Systems Engineering.',
      skills: ['Python', 'Deep Learning', 'RAG', 'Agents'],
      career: 'AI Engineer',
      level: 'ALL_LEVELS',
      status: 'PUBLISHED',
      courses: [course._id],
    });

    domainDoc = await LearningPathDomain.create({
      learningPathId: learningPath._id,
      title: 'Generative AI & Information Retrieval',
      slug: `genai-ir-${timestamp}`,
      order: 1,
      status: 'PUBLISHED',
    });

    await LearningPathDomainTopic.create({
      learningPathId: learningPath._id,
      domainId: domainDoc._id,
      topicId: topicDoc._id,
      order: 1,
      isRequired: true,
      status: 'ACTIVE',
    });
  });

  after(async () => {
    // Cleanup test data
    if (studentUser) await User.deleteOne({ _id: studentUser._id });
    if (tutorA) await User.deleteOne({ _id: tutorA._id });
    if (tutorB) await User.deleteOne({ _id: tutorB._id });
    if (tutorC) await User.deleteOne({ _id: tutorC._id });
    if (course) await Course.deleteOne({ _id: course._id });
    if (moduleDoc) await Module.deleteOne({ _id: moduleDoc._id });
    if (topicDoc) await Topic.deleteOne({ _id: topicDoc._id });
    if (offeringA) await TopicContentOffering.deleteOne({ _id: offeringA._id });
    if (offeringB) await TopicContentOffering.deleteOne({ _id: offeringB._id });
    if (offeringC) await TopicContentOffering.deleteOne({ _id: offeringC._id });
    if (lessonA) await Lesson.deleteOne({ _id: lessonA._id });
    if (lessonB) await Lesson.deleteOne({ _id: lessonB._id });
    if (lessonC) await Lesson.deleteOne({ _id: lessonC._id });
    if (learningPath) await LearningPath.deleteOne({ _id: learningPath._id });
    if (domainDoc) await LearningPathDomain.deleteOne({ _id: domainDoc._id });
    await LearningPathDomainTopic.deleteMany({ learningPathId: learningPath?._id });
    await Entitlement.deleteMany({ userId: studentUser?._id });
    await Order.deleteMany({ userId: studentUser?._id });
    await OrderItem.deleteMany({ instructorId: { $in: [tutorA?._id, tutorB?._id, tutorC?._id] } });
    await Payment.deleteMany({ userId: studentUser?._id });
    await InstructorEarning.deleteMany({ instructorId: { $in: [tutorA?._id, tutorB?._id, tutorC?._id] } });
    await disconnectDB();
  });

  it('1. Should return dynamic Learning Path with real domain and topic counts', async () => {
    const res = await LearningPathService.getLearningPaths({ limit: 10 });
    assert.ok(Array.isArray(res.learningPaths), 'Should return learningPaths array');
    const path = res.learningPaths.find((p) => p.slug === learningPath.slug);
    assert.ok(path, 'Created learning path must be in catalog');
    assert.strictEqual(path.domainsCount, 1, 'Should have exactly 1 domain from MongoDB');
    assert.strictEqual(path.topicsCount, 1, 'Should have exactly 1 topic in the domain');
  });

  it('2. Should fetch dynamic Roadmap by slug with real topics and lowest starting price', async () => {
    const roadmap = await LearningPathService.getLearningPathBySlug(learningPath.slug);
    assert.ok(roadmap, 'Roadmap must be returned');
    assert.strictEqual(roadmap.domains.length, 1, 'Roadmap must contain exactly 1 domain');
    assert.strictEqual(roadmap.domains[0].topics.length, 1, 'Domain must contain 1 topic');

    const topicItem = roadmap.domains[0].topics[0];
    assert.strictEqual(topicItem.title, topicDoc.title);
    assert.strictEqual(topicItem.tutorsCount, 3, 'Topic must show 3 available tutor offerings');
    assert.strictEqual(topicItem.startingPrice, 799, 'Starting price must be ₹799 (lowest offering price, NOT Topic.price)');
  });

  it('3. Topic detail must list all 3 independent tutor offerings with authoritative prices', async () => {
    const topicDetail = await LearningPathService.getTopicDetail(topicDoc._id.toString());
    assert.ok(topicDetail, 'Topic detail must be found');
    assert.strictEqual(topicDetail.offeringsCount, 3, 'Must return all 3 published tutor offerings');

    const prices = topicDetail.offerings.map((o) => o.price);
    assert.ok(prices.includes(799), 'Must include Tutor A price ₹799');
    assert.ok(prices.includes(999), 'Must include Tutor B price ₹999');
    assert.ok(prices.includes(1499), 'Must include Tutor C price ₹1,499');
  });

  it('4. Student purchases Tutor C offering (₹1,499) -> Verifies order, payment, and entitlement', async () => {
    const purchaseResult = await LearningPathService.purchaseOffering({
      offeringId: offeringC._id.toString(),
      userId: studentUser._id.toString(),
    });

    assert.strictEqual(purchaseResult.success, true);
    assert.strictEqual(purchaseResult.amount, 1499);

    // Verify Entitlement in DB
    const entitlement = await Entitlement.findOne({
      userId: studentUser._id,
      productId: offeringC._id,
      status: ENTITLEMENT_STATUS.ACTIVE,
    });

    assert.ok(entitlement, 'Active Entitlement must exist for Tutor C offering');
    assert.strictEqual(entitlement.productType, PRODUCT_TYPES.CONTENT_OFFERING);

    // Verify Instructor Earnings attributed to Tutor C
    const earnings = await InstructorEarning.findOne({
      instructorId: tutorC._id,
    });
    assert.ok(earnings, 'Earnings must be credited to Tutor C');
    assert.strictEqual(earnings.grossAmount, 1499);
  });

  it('5. STRICT ACCESS ISOLATION: Tutor C is unlocked; Tutor B remains 403 locked', async () => {
    // 5a. Student accesses Tutor C paid lesson -> SUCCESS
    const contentC = await LearningPathService.getOfferingLessonContent(
      offeringC._id.toString(),
      lessonC._id.toString(),
      studentUser._id.toString()
    );
    assert.ok(contentC, 'Tutor C content must be accessible');
    assert.strictEqual(contentC.playbackReference, 'stream_c1.m3u8');

    // 5b. Student attempts to access Tutor B non-preview paid lesson -> MUST THROW 403 FORBIDDEN
    await assert.rejects(
      async () => {
        await LearningPathService.getOfferingLessonContent(
          offeringB._id.toString(),
          lessonB._id.toString(),
          studentUser._id.toString()
        );
      },
      (err) => {
        assert.ok(err.message.includes('FORBIDDEN'), 'Must return FORBIDDEN for unpurchased Tutor B');
        return true;
      }
    );
  });

  it('6. Free preview lesson is accessible even without purchase', async () => {
    const previewContent = await LearningPathService.getOfferingLessonContent(
      offeringA._id.toString(),
      lessonA._id.toString(),
      studentUser._id.toString()
    );
    assert.ok(previewContent, 'Free preview lesson must be accessible');
  });

  it('7. Progress tracking is isolated to the purchased offering', async () => {
    await LearningPathService.updateOfferingProgress({
      offeringId: offeringC._id.toString(),
      lessonId: lessonC._id.toString(),
      userId: studentUser._id.toString(),
      watchedSeconds: 2400,
      totalSeconds: 2400,
      completed: true,
    });

    const roadmapAfter = await LearningPathService.getLearningPathBySlug(
      learningPath.slug,
      studentUser._id.toString()
    );
    const userTopicStatus = roadmapAfter.domains[0].topics[0].userStatus;
    assert.strictEqual(userTopicStatus.isPurchased, true);
    assert.strictEqual(userTopicStatus.isCompleted, true);
    assert.strictEqual(roadmapAfter.overallProgress, 100);
  });
});
