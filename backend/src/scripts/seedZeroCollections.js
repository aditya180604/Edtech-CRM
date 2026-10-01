import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import * as models from '../models/index.js';
import {
  ROLES,
  USER_STATUS,
  PRODUCT_TYPES,
  VIDEO_PROCESSING_STATUS,
  ENTITLEMENT_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  TRANSACTION_TYPES,
  PIPELINE_STAGES,
  COMMUNICATION_CHANNELS,
  CONTENT_ACCESS_TYPES,
} from '../config/constants.js';

async function seedEmptyCollections() {
  console.log('====================================================');
  console.log('     SEEDING EMPTY COLLECTIONS (COUNT = 0 ONLY)     ');
  console.log('====================================================\n');

  try {
    const conn = await connectDB();
    const db = conn.connection.db;

    // Fetch an existing user or fallback user ID
    let sampleUser = await models.User.findOne({ email: 'toppix851@gmail.com' });
    if (!sampleUser) {
      sampleUser = await models.User.findOne({});
    }
    const userId = sampleUser ? sampleUser._id : new mongoose.Types.ObjectId();

    // Fetch an existing course or fallback course ID
    let sampleCourse = await models.Course.findOne({});
    const courseId = sampleCourse ? sampleCourse._id : new mongoose.Types.ObjectId();

    // Create shared ObjectIds for clean relational linking across empty collections
    const moduleId = new mongoose.Types.ObjectId();
    const topicId = new mongoose.Types.ObjectId();
    const lessonId = new mongoose.Types.ObjectId();
    const videoId = new mongoose.Types.ObjectId();
    const quizId = new mongoose.Types.ObjectId();
    const questionId = new mongoose.Types.ObjectId();
    const assignmentId = new mongoose.Types.ObjectId();
    const orderId = new mongoose.Types.ObjectId();
    const paymentId = new mongoose.Types.ObjectId();
    const entitlementId = new mongoose.Types.ObjectId();
    const webinarId = new mongoose.Types.ObjectId();
    const liveSessionId = new mongoose.Types.ObjectId();
    const leadId = new mongoose.Types.ObjectId();
    const conversationId = new mongoose.Types.ObjectId();
    const messageId = new mongoose.Types.ObjectId();
    const supportTicketId = new mongoose.Types.ObjectId();
    const promotionId = new mongoose.Types.ObjectId();
    const communityQuestionId = new mongoose.Types.ObjectId();

    // Pre-defined single document templates for every domain model
    const sampleDocuments = {
      InstructorProfile: {
        userId,
        bio: 'Senior Full Stack & Cloud Architect with 12+ years of industry experience.',
        expertise: ['React', 'Node.js', 'TypeScript', 'Cloud Architecture'],
        skills: ['JavaScript', 'MongoDB', 'AWS', 'Docker'],
        experience: '12 Years',
        qualifications: ['M.S. in Computer Science', 'AWS Certified Solutions Architect'],
        currentOrganization: 'Edutech Learning Labs',
        country: 'United States',
        identityStatus: 'VERIFIED',
        verificationStatus: 'APPROVED',
        kycStatus: 'VERIFIED',
        payoutStatus: 'ACTIVE',
        paymentAccount: { provider: 'STRIPE', accountId: 'acct_sample_12345' },
        providerOnboardingState: 'COMPLETED',
      },
      Module: {
        _id: moduleId,
        moduleId: 'MOD-101',
        courseId,
        title: 'Module 1: Foundations of Full Stack Development',
        description: 'Comprehensive introduction to modern web architecture and tooling.',
        order: 1,
        status: 'PUBLISHED',
      },
      Topic: {
        _id: topicId,
        topicId: 'TOP-101',
        moduleId,
        courseId,
        title: 'Mastering TypeScript & State Architecture',
        slug: 'mastering-typescript-state-architecture',
        description: 'Atomic learning unit on advanced TypeScript and scalable design patterns.',
        price: 29.99,
        currency: 'USD',
        duration: 180, // minutes
        difficulty: 'INTERMEDIATE',
        skills: ['TypeScript', 'Generics', 'State Management'],
        prerequisites: ['JavaScript ES6+'],
        learningObjectives: ['Understand strict typing', 'Build scalable interfaces'],
        isFree: false,
        status: 'PUBLISHED',
        order: 1,
      },
      Lesson: {
        _id: lessonId,
        lessonId: 'LES-101',
        topicId,
        title: 'Lesson 1.1: Setting up Strict TypeScript Project',
        videoId,
        playbackReference: 'hls/les-101/master.m3u8',
        duration: 900, // 15 mins in seconds
        transcript: 'Welcome to this lesson on setting up enterprise TypeScript...',
        resources: [],
        order: 1,
        status: 'PUBLISHED',
      },
      Resource: {
        courseId,
        moduleId,
        topicId,
        lessonId,
        name: 'TypeScript Enterprise Cheat Sheet.pdf',
        type: 'PDF',
        objectKey: 'resources/typescript-cheat-sheet.pdf',
        mimeType: 'application/pdf',
        size: 2048576,
        isDownloadable: true,
        status: 'ACTIVE',
        uploadedBy: userId,
      },
      Video: {
        _id: videoId,
        videoId: 'VID-101',
        lessonId,
        sourceObjectKey: 'raw-videos/lesson-101.mp4',
        processingStatus: VIDEO_PROCESSING_STATUS.READY,
        duration: 900,
        thumbnailObjectKey: 'thumbnails/lesson-101.jpg',
        hlsManifestObjectKey: 'hls/les-101/master.m3u8',
        availableQualities: ['1080p', '720p', '480p', '360p'],
        captions: { en: 'captions/lesson-101-en.vtt' },
        transcript: 'Complete lesson transcript for automated search indexing...',
      },
      LearningPath: {
        learningPathId: 'PATH-101',
        title: 'Full Stack Cloud Engineer Career Track',
        slug: 'full-stack-cloud-engineer-career-track',
        description: 'Guided pathway taking you from basics to enterprise cloud architecture.',
        skills: ['Frontend', 'Backend', 'DevOps', 'Cloud Deployment'],
        career: 'Full Stack Engineer',
        level: 'ALL_LEVELS',
        estimatedDuration: '6 Months',
        items: [{ title: 'Foundation', duration: '4 Weeks' }],
        courses: [courseId],
        topics: [topicId],
        certificate: true,
        status: 'PUBLISHED',
        createdBy: userId,
      },
      Quiz: {
        _id: quizId,
        quizId: 'QUIZ-101',
        courseId,
        topicId,
        title: 'TypeScript Foundations Mastery Quiz',
        description: 'Test your understanding of types, generics, and union types.',
        questions: [questionId],
        passingScore: 80,
        attemptLimit: 3,
        duration: 30,
        status: 'ACTIVE',
        createdBy: userId,
      },
      Question: {
        _id: questionId,
        questionId: 'QUE-101',
        quizId,
        questionText: 'What is the primary benefit of TypeScript strict mode?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { text: 'Catches type mismatches at compile time', isCorrect: true },
          { text: 'Makes JavaScript code run faster in browsers', isCorrect: false },
          { text: 'Automatically writes CSS styles', isCorrect: false },
        ],
        correctAnswer: 'Catches type mismatches at compile time',
        marks: 5,
        explanation: 'Strict mode forces strict null checking and type safety.',
        order: 1,
      },
      QuizAttempt: {
        attemptId: 'ATT-101',
        quizId,
        userId,
        answers: [{ questionId, selectedAnswer: 'Catches type mismatches at compile time' }],
        score: 5,
        percentage: 100,
        passed: true,
        attemptNumber: 1,
        startedAt: new Date(Date.now() - 15 * 60000),
        submittedAt: new Date(),
      },
      Assignment: {
        _id: assignmentId,
        assignmentId: 'ASG-101',
        courseId,
        topicId,
        lessonId,
        title: 'Build a Modular Type-Safe API Client',
        description: 'Construct a reusable Axios/Fetch wrapper with generic return types.',
        instructions: 'Submit a GitHub repository link or ZIP file containing your code.',
        deadline: new Date(Date.now() + 7 * 24 * 3600000),
        maxMarks: 100,
        status: 'ACTIVE',
        createdBy: userId,
      },
      AssignmentSubmission: {
        submissionId: 'SUB-101',
        assignmentId,
        userId,
        content: 'Here is my implementation repository: https://github.com/example/api-client',
        files: ['submissions/sub-101-source.zip'],
        submittedAt: new Date(),
        status: 'GRADED',
        marks: 95,
        feedback: 'Excellent use of TypeScript generics and error boundaries!',
        gradedBy: userId,
        gradedAt: new Date(),
      },
      Cart: {
        userId,
        items: [
          {
            productType: PRODUCT_TYPES.TOPIC,
            productId: topicId,
            price: 29.99,
            currency: 'USD',
          },
        ],
        subtotal: 29.99,
        discount: 0,
        tax: 0,
        credit: 0,
        finalAmount: 29.99,
      },
      Order: {
        _id: orderId,
        orderId: 'ORD-2026-001',
        userId,
        items: [
          {
            productType: PRODUCT_TYPES.TOPIC,
            productId: topicId,
            title: 'Mastering TypeScript & State Architecture',
            price: 29.99,
          },
        ],
        subtotal: 29.99,
        discount: 0,
        tax: 0,
        credit: 0,
        finalAmount: 29.99,
        currency: 'USD',
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        orderStatus: ORDER_STATUS.COMPLETED,
        paymentId: 'PAY-2026-001',
      },
      OrderItem: {
        orderId,
        productType: PRODUCT_TYPES.TOPIC,
        productId: topicId,
        courseId,
        topicId,
        instructorId: userId,
        quantity: 1,
        unitPrice: 29.99,
        discount: 0,
        tax: 0,
        finalPrice: 29.99,
        currency: 'USD',
      },
      Payment: {
        _id: paymentId,
        orderId,
        userId,
        provider: 'STRIPE',
        providerPaymentId: 'pi_sample_stripe_38491823',
        amount: 29.99,
        currency: 'USD',
        status: PAYMENT_STATUS.SUCCESS,
        paymentMethod: 'CREDIT_CARD',
        transactionReference: 'txn_sample_ref_98124',
        webhookEventId: 'evt_sample_stripe_823471',
        paidAt: new Date(),
      },
      Refund: {
        orderId,
        paymentId,
        userId,
        amount: 29.99,
        currency: 'USD',
        reason: 'Sample audit record of refund review',
        status: 'PENDING',
        providerRefundId: 're_sample_123',
        processedBy: userId,
        processedAt: new Date(),
      },
      Entitlement: {
        _id: entitlementId,
        userId,
        productType: PRODUCT_TYPES.TOPIC,
        productId: topicId,
        courseId,
        topicId,
        orderId,
        source: 'PURCHASE',
        status: ENTITLEMENT_STATUS.ACTIVE,
        startsAt: new Date(),
        grantedAt: new Date(),
      },
      TopicCredit: {
        creditId: 'CRD-101',
        userId,
        courseId,
        sourceTopicPurchases: [entitlementId],
        eligibleAmount: 29.99,
        usedAmount: 0,
        remainingAmount: 29.99,
        status: 'ACTIVE',
      },
      CourseUpgrade: {
        upgradeId: 'UPG-101',
        userId,
        courseId,
        coursePrice: 99.99,
        eligibleCredit: 29.99,
        upgradePrice: 70.00,
        currency: 'USD',
        orderId,
        status: 'PENDING',
      },
      FinancialLedger: {
        ledgerId: 'LED-2026-001',
        userId,
        orderId,
        type: TRANSACTION_TYPES.ORDER_PAYMENT,
        referenceId: 'ORD-2026-001',
        amount: 29.99,
        currency: 'USD',
        direction: 'CREDIT',
        description: 'Payment received for Topic Purchase: TOP-101',
        balanceBefore: 0,
        balanceAfter: 29.99,
      },
      LearningProgress: {
        userId,
        courseId,
        moduleId,
        topicId,
        lessonId,
        watchedSeconds: 900,
        totalSeconds: 900,
        progressPercent: 100,
        completed: true,
        lastWatchedAt: new Date(),
      },
      VideoProgress: {
        userId,
        lessonId,
        watchedSeconds: 900,
        totalSeconds: 900,
        progressPercent: 100,
        completed: true,
        lastPosition: 900,
        lastWatchedAt: new Date(),
      },
      Certificate: {
        certificateId: 'CERT-2026-001',
        certificateNumber: 'EDU-CERT-83921-2026',
        userId,
        courseId,
        instructorId: userId,
        completionPercentage: 100,
        issueDate: new Date(),
        verificationUrl: 'https://edutech.io/verify/EDU-CERT-83921-2026',
        certificateAssetUrl: 'https://cdn.edutech.io/certificates/EDU-CERT-83921-2026.pdf',
        status: 'ISSUED',
      },
      Review: {
        userId,
        courseId,
        topicId,
        rating: 5,
        title: 'Outstanding structured content!',
        comment: 'Clear explanation of advanced architecture principles with practical examples.',
        status: 'PUBLISHED',
        isVerifiedPurchase: true,
      },
      Rating: {
        userId,
        courseId,
        topicId,
        rating: 5,
      },
      CommunityQuestion: {
        _id: communityQuestionId,
        userId,
        courseId,
        topicId,
        lessonId,
        question: 'How do we handle type widening when inferring nested generic arguments?',
        status: 'OPEN',
      },
      Answer: {
        questionId: communityQuestionId,
        userId,
        answer: 'You can use the `as const` assertion or specify the generic type parameter explicitly.',
        isAccepted: true,
      },
      Wishlist: {
        userId,
        productType: PRODUCT_TYPES.COURSE,
        productId: courseId,
      },
      Webinar: {
        _id: webinarId,
        webinarId: 'WEB-2026-001',
        title: 'Live Workshop: Scaling Node.js Microservices to 100k Req/Sec',
        slug: 'scaling-nodejs-microservices-live-workshop',
        description: 'Deep dive into event-driven patterns, streaming, and caching strategies.',
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
        instructorId: userId,
        category: 'Backend Engineering',
        startTime: new Date(Date.now() + 3 * 24 * 3600000),
        endTime: new Date(Date.now() + 3 * 24 * 3600000 + 7200000),
        timezone: 'UTC',
        capacity: 250,
        meetingProvider: 'LIVEKIT',
        meetingUrl: 'https://live.edutech.io/room/web-2026-001',
        price: 0,
        currency: 'USD',
        paymentRequired: false,
        status: 'SCHEDULED',
        registrations: [userId],
        attendance: [],
      },
      LiveSession: {
        _id: liveSessionId,
        webinarId,
        instructorId: userId,
        provider: 'LIVEKIT',
        providerSessionId: 'session_live_98124',
        startTime: new Date(Date.now() + 3 * 24 * 3600000),
        endTime: new Date(Date.now() + 3 * 24 * 3600000 + 7200000),
        status: 'SCHEDULED',
        accessReference: 'token_sample_session_98124',
      },
      Booking: {
        userId,
        liveSessionId,
        status: 'CONFIRMED',
        bookedAt: new Date(),
      },
      LeadEvent: {
        leadId,
        eventType: 'TOPIC_PAGE_VIEWED',
        entityType: 'TOPIC',
        entityId: topicId,
        metadata: { source: 'ORGANIC_SEARCH', campaign: 'SPRING_2026' },
      },
      Campaign: {
        name: 'Spring 2026 Skill Accelerator',
        type: 'MARKETING',
        channel: 'EMAIL',
        targetAudience: { interest: 'Full Stack Development' },
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 3600000),
        status: 'ACTIVE',
        budget: 5000,
        createdBy: userId,
      },
      Event: {
        eventId: 'EVT-2026-001',
        eventType: 'TOPIC_PURCHASED',
        userId,
        entityType: 'TOPIC',
        entityId: topicId,
        metadata: { price: 29.99, orderId: 'ORD-2026-001' },
        timestamp: new Date(),
        source: 'CHECKOUT_PAGE',
      },
      Conversation: {
        _id: conversationId,
        conversationId: 'CONV-101',
        studentId: userId,
        assignedCounselorId: userId,
        channel: COMMUNICATION_CHANNELS.IN_APP,
        subject: 'Inquiry regarding career track prerequisites',
        status: 'OPEN',
        priority: 'MEDIUM',
        lastMessageAt: new Date(),
      },
      Message: {
        _id: messageId,
        messageId: 'MSG-101',
        conversationId,
        senderId: userId,
        receiverId: userId,
        messageType: 'TEXT',
        content: 'Hello! I would like to know if basic JavaScript knowledge is enough for this path.',
        attachments: [],
        direction: 'INBOUND',
        deliveryStatus: 'DELIVERED',
        readAt: new Date(),
      },
      CommunicationLog: {
        userId,
        conversationId,
        channel: 'IN_APP',
        direction: 'INBOUND',
        eventType: 'STUDENT_MESSAGE_SENT',
        messageId,
        status: 'SUCCESS',
        metadata: { client: 'WEB_APP' },
      },
      Notification: {
        notificationId: 'NOTIF-101',
        userId,
        type: 'ENROLLMENT_CONFIRMATION',
        title: 'Welcome to Mastering TypeScript!',
        message: 'Your topic enrollment has been confirmed. Start learning now.',
        entityType: 'TOPIC',
        entityId: topicId,
        isRead: false,
      },
      NotificationPreference: {
        userId,
        email: true,
        whatsapp: true,
        sms: false,
        push: true,
        inApp: true,
        courseUpdates: true,
        paymentUpdates: true,
        marketing: false,
        webinarReminders: true,
      },
      ContentVersion: {
        contentId: courseId,
        contentType: 'COURSE',
        version: 1,
        changedBy: userId,
        changeSummary: 'Initial curriculum structure published.',
        snapshot: { title: 'Modern Full Stack Course', modulesCount: 1 },
        status: 'PUBLISHED',
      },
      ContentAccessRule: {
        contentType: 'TOPIC',
        contentId: topicId,
        accessType: CONTENT_ACCESS_TYPES.PAID,
        roles: [ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN],
        requiresPurchase: true,
        requiresEnrollment: true,
        requiresEntitlement: true,
        status: 'ACTIVE',
      },
      SupportTicket: {
        _id: supportTicketId,
        ticketId: 'TKT-2026-001',
        userId,
        category: 'COURSE',
        subject: 'Question on Lesson 1.1 code repo download',
        description: 'Unable to unzip the repository archive with standard zip utility.',
        priority: 'MEDIUM',
        status: 'OPEN',
        assignedTo: userId,
        attachments: [],
      },
      SupportMessage: {
        ticketId: supportTicketId,
        senderId: userId,
        message: 'Our support team has verified and re-uploaded the zip archive. Please try again.',
        attachments: [],
      },
      Coupon: {
        couponId: 'CPN-SAVE20',
        code: 'SAVE20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        currency: 'USD',
        minimumAmount: 20,
        maximumDiscount: 50,
        usageLimit: 500,
        usedCount: 1,
        perUserLimit: 1,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 60 * 24 * 3600000),
        status: 'ACTIVE',
      },
      Promotion: {
        _id: promotionId,
        promotionId: 'PROMO-SPRING2026',
        name: 'Spring Learning Sale',
        description: 'Get 20% off all individual topics this week.',
        type: 'DISCOUNT',
        products: [topicId],
        discountRules: { percentage: 20 },
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 3600000),
        status: 'ACTIVE',
        createdBy: userId,
      },
      InstructorEarning: {
        instructorId: userId,
        orderId,
        orderItemId: new mongoose.Types.ObjectId(),
        grossAmount: 29.99,
        discountAmount: 0,
        refundAmount: 0,
        paymentFee: 0.99,
        platformCommission: 5.00,
        taxAmount: 0,
        netEarning: 24.00,
        currency: 'USD',
        status: 'AVAILABLE',
      },
      Payout: {
        instructorId: userId,
        amount: 24.00,
        currency: 'USD',
        paymentProvider: 'STRIPE_CONNECT',
        providerPayoutId: 'po_sample_stripe_82314',
        status: 'COMPLETED',
        requestedAt: new Date(Date.now() - 24 * 3600000),
        processedAt: new Date(),
      },
      Recommendation: {
        userId,
        sourceEntityType: 'TOPIC',
        sourceEntityId: topicId,
        recommendedEntityType: 'COURSE',
        recommendedEntityId: courseId,
        reason: 'Recommended based on your recent enrollment in TypeScript foundations.',
        score: 0.95,
        modelVersion: 'v1.0',
        expiresAt: new Date(Date.now() + 30 * 24 * 3600000),
      },
      Analytics: {
        metric: 'TOPIC_PAGE_VIEWS',
        dimension: 'DAILY',
        value: 1420,
        date: new Date(),
        courseId,
        topicId,
        instructorId: userId,
        country: 'US',
        channel: 'ORGANIC',
      },
    };

    const results = [];

    for (const [modelName, Model] of Object.entries(models)) {
      if (!Model || !Model.collection) continue;

      const collectionName = Model.collection.name;
      const countBefore = await db.collection(collectionName).countDocuments();

      if (countBefore === 0) {
        const docData = sampleDocuments[modelName];
        if (docData) {
          await Model.create(docData);
          const countAfter = await db.collection(collectionName).countDocuments();
          results.push({
            collection: collectionName,
            model: modelName,
            before: countBefore,
            after: countAfter,
            status: 'SEEDED (1 doc added)',
          });
        } else {
          results.push({
            collection: collectionName,
            model: modelName,
            before: countBefore,
            after: countBefore,
            status: 'SKIPPED (no sample template)',
          });
        }
      } else {
        results.push({
          collection: collectionName,
          model: modelName,
          before: countBefore,
          after: countBefore,
          status: 'UNTOUCHED (already had docs)',
        });
      }
    }

    console.log('----------------------------------------------------');
    console.log('               SEEDING SUMMARY REPORT               ');
    console.log('----------------------------------------------------\n');
    console.table(results);

    const emptyCount = results.filter((r) => r.after === 0).length;
    const seededCount = results.filter((r) => r.status.startsWith('SEEDED')).length;
    const untouchedCount = results.filter((r) => r.status.startsWith('UNTOUCHED')).length;

    console.log(`\nTotal collections checked: ${results.length}`);
    console.log(`Collections seeded with 1 document: ${seededCount}`);
    console.log(`Collections preserved untouched: ${untouchedCount}`);
    console.log(`Remaining empty collections: ${emptyCount}\n`);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n[Error] Seeding failed:', error);
    await disconnectDB();
    process.exit(1);
  }
}

seedEmptyCollections();
