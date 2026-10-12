import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  LearningPath,
  LearningPathDomain,
  LearningPathDomainTopic,
  Course,
  Module,
  Topic,
  User,
} from './src/models/index.js';

dotenv.config();

async function seedSectorLearningPaths() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DATABASE_NAME || 'edutech_db' });
  console.log('Connected.');

  // Find a creator user (super admin or instructor)
  const creator = (await User.findOne({ role: { $in: ['SUPER_ADMIN', 'INSTRUCTOR', 'admin'] } })) || (await User.findOne());
  const creatorId = creator?._id;

  // 1. DATA SCIENCE & AI LEARNING PATH
  const dsCourse = await Course.findOne({ slug: 'data-science-machine-learning-bootcamp-from-zero-to-hero' });
  if (dsCourse) {
    const existingDsPath = await LearningPath.findOne({ slug: 'data-science-machine-learning-career-track' });
    if (!existingDsPath) {
      console.log('Creating Data Science Learning Path...');
      const dsModules = await Module.find({ courseId: dsCourse._id }).sort({ order: 1 });
      const dsTopics = await Topic.find({ courseId: dsCourse._id });

      const dsPath = await LearningPath.create({
        learningPathId: 'PATH-DS-201',
        title: 'Data Science & Machine Learning Career Track',
        slug: 'data-science-machine-learning-career-track',
        description: 'Complete hands-on pathway from Python foundations to advanced Machine Learning algorithms, statistical modeling, and data-driven systems.',
        skills: ['Python', 'Data Science', 'Machine Learning', 'Data Analysis', 'Statistics'],
        career: 'Data Scientist',
        level: 'BEGINNER',
        estimatedDuration: '4 Months',
        courses: [dsCourse._id],
        topics: dsTopics.map((t) => t._id),
        certificate: true,
        status: 'PUBLISHED',
        createdBy: creatorId,
      });

      // Create Domain for each Module
      for (let i = 0; i < dsModules.length; i++) {
        const mod = dsModules[i];
        const domain = await LearningPathDomain.create({
          domainId: `DOM-DS-${i + 1}`,
          learningPathId: dsPath._id,
          title: mod.title,
          slug: `ds-domain-${i + 1}-${mod.slug || 'module'}`,
          description: mod.description || 'Core domain modules covering data foundations.',
          order: i + 1,
          status: 'PUBLISHED',
        });

        // Link topics for this module
        const modTopics = await Topic.find({ moduleId: mod._id });
        for (let j = 0; j < modTopics.length; j++) {
          await LearningPathDomainTopic.create({
            learningPathId: dsPath._id,
            domainId: domain._id,
            topicId: modTopics[j]._id,
            order: j + 1,
            isRequired: true,
            isRecommended: j === 0,
            status: 'ACTIVE',
          });
        }
      }
      console.log('✓ Created Data Science Learning Path with domains and topics.');
    } else {
      console.log('Data Science Learning Path already exists.');
    }
  }

  // 2. CYBERSECURITY LEARNING PATH
  const cyberCourse = await Course.findOne({ slug: 'cybersecurity-fundamentals-from-beginner-to-security-analyst-7702' });
  if (cyberCourse) {
    const existingCyberPath = await LearningPath.findOne({ slug: 'cybersecurity-analyst-defense-career-track' });
    if (!existingCyberPath) {
      console.log('Creating Cybersecurity Learning Path...');
      const cyberModules = await Module.find({ courseId: cyberCourse._id }).sort({ order: 1 });
      const cyberTopics = await Topic.find({ courseId: cyberCourse._id });

      const cyberPath = await LearningPath.create({
        learningPathId: 'PATH-SEC-301',
        title: 'Cybersecurity & Threat Defense Career Track',
        slug: 'cybersecurity-analyst-defense-career-track',
        description: 'Comprehensive security roadmap covering the CIA triad, network defense protocols, vulnerability assessment, and threat mitigation tactics.',
        skills: ['Cybersecurity', 'Network Security', 'Threat Analysis', 'Vulnerability Assessment', 'Linux Security'],
        career: 'Security Analyst',
        level: 'BEGINNER',
        estimatedDuration: '5 Months',
        courses: [cyberCourse._id],
        topics: cyberTopics.map((t) => t._id),
        certificate: true,
        status: 'PUBLISHED',
        createdBy: creatorId,
      });

      for (let i = 0; i < cyberModules.length; i++) {
        const mod = cyberModules[i];
        const domain = await LearningPathDomain.create({
          domainId: `DOM-SEC-${i + 1}`,
          learningPathId: cyberPath._id,
          title: mod.title,
          slug: `sec-domain-${i + 1}-${mod.slug || 'module'}`,
          description: mod.description || 'Core domain modules covering threat analysis and networking.',
          order: i + 1,
          status: 'PUBLISHED',
        });

        const modTopics = await Topic.find({ moduleId: mod._id });
        for (let j = 0; j < modTopics.length; j++) {
          await LearningPathDomainTopic.create({
            learningPathId: cyberPath._id,
            domainId: domain._id,
            topicId: modTopics[j]._id,
            order: j + 1,
            isRequired: true,
            isRecommended: j === 0,
            status: 'ACTIVE',
          });
        }
      }
      console.log('✓ Created Cybersecurity Learning Path with domains and topics.');
    } else {
      console.log('Cybersecurity Learning Path already exists.');
    }
  }

  // 3. FULL STACK CLOUD & DEVOPS ENGINEER PATH (Upgrade with Docker & Node courses)
  const nodeCourse = await Course.findOne({ slug: 'nodejs-1954' });
  const dockerCourse = await Course.findOne({ slug: 'docker-8889' });
  const devPath = await LearningPath.findOne({ slug: 'full-stack-cloud-engineer-career-track' });
  if (devPath && (nodeCourse || dockerCourse)) {
    console.log('Linking NodeJS & Docker courses to Full Stack Cloud Path...');
    const courseIdsToAdd = [nodeCourse?._id, dockerCourse?._id].filter(Boolean);
    await LearningPath.findByIdAndUpdate(devPath._id, {
      $addToSet: { courses: { $each: courseIdsToAdd } },
    });

    // Check if domains for Node & Docker exist, if not add them
    if (nodeCourse) {
      const nodeModules = await Module.find({ courseId: nodeCourse._id });
      for (const mod of nodeModules) {
        let domain = await LearningPathDomain.findOne({ learningPathId: devPath._id, title: mod.title });
        if (!domain) {
          const domCount = await LearningPathDomain.countDocuments({ learningPathId: devPath._id });
          domain = await LearningPathDomain.create({
            domainId: `DOM-DEV-${domCount + 1}`,
            learningPathId: devPath._id,
            title: mod.title,
            slug: `dev-domain-${domCount + 1}-${mod.slug || 'module'}`,
            description: mod.description || 'Backend server architectures and REST APIs.',
            order: domCount + 1,
            status: 'PUBLISHED',
          });
          const modTopics = await Topic.find({ moduleId: mod._id });
          for (let j = 0; j < modTopics.length; j++) {
            await LearningPathDomainTopic.create({
              learningPathId: devPath._id,
              domainId: domain._id,
              topicId: modTopics[j]._id,
              order: j + 1,
              isRequired: true,
              status: 'ACTIVE',
            });
          }
        }
      }
    }

    if (dockerCourse) {
      const dockerModules = await Module.find({ courseId: dockerCourse._id });
      for (const mod of dockerModules) {
        let domain = await LearningPathDomain.findOne({ learningPathId: devPath._id, title: mod.title });
        if (!domain) {
          const domCount = await LearningPathDomain.countDocuments({ learningPathId: devPath._id });
          domain = await LearningPathDomain.create({
            domainId: `DOM-DEV-${domCount + 1}`,
            learningPathId: devPath._id,
            title: mod.title,
            slug: `dev-domain-${domCount + 1}-${mod.slug || 'module'}`,
            description: mod.description || 'Containerization and environment orchestration.',
            order: domCount + 1,
            status: 'PUBLISHED',
          });
          const modTopics = await Topic.find({ moduleId: mod._id });
          for (let j = 0; j < modTopics.length; j++) {
            await LearningPathDomainTopic.create({
              learningPathId: devPath._id,
              domainId: domain._id,
              topicId: modTopics[j]._id,
              order: j + 1,
              isRequired: true,
              status: 'ACTIVE',
            });
          }
        }
      }
    }
    console.log('✓ Full Stack Cloud Engineer Path updated with domains.');
  }

  const finalPaths = await LearningPath.find().lean();
  console.log(`ALL DONE! Total Learning Paths in DB now: ${finalPaths.length}`);
  for (const p of finalPaths) {
    const domCount = await LearningPathDomain.countDocuments({ learningPathId: p._id, status: 'PUBLISHED' });
    const topCount = await LearningPathDomainTopic.countDocuments({ learningPathId: p._id, status: 'ACTIVE' });
    console.log(`- ${p.title} (${p.career}) | ${domCount} Domains | ${topCount} Topics | Status: ${p.status}`);
  }

  await mongoose.disconnect();
}

seedSectorLearningPaths().catch(console.error);
