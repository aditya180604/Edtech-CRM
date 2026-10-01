import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  User,
  InstructorProfile,
  Course,
  Module,
  Topic,
  Lesson,
  Webinar,
  Review,
  CommunityQuestion,
  Answer,
  Entitlement,
} from '../models/index.js';
import { ROLES } from '../config/constants.js';

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.DATABASE_NAME || 'edutech_db';
    console.log(`Connecting to MongoDB (${dbName})...`);
    await mongoose.connect(mongoUri, { dbName });
    console.log('MongoDB Connected.');

    // Find or create an instructor user
    let instructor = await User.findOne({ role: ROLES.INSTRUCTOR });
    if (!instructor) {
      console.log('Creating demo instructor user...');
      const passwordHash = await User.hashPassword('Instructor@123');
      instructor = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'instructor@edutech.com',
        passwordHash,
        role: ROLES.INSTRUCTOR,
        status: 'ACTIVE',
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      });
    }

    // Ensure Instructor Profile
    let profile = await InstructorProfile.findOne({ userId: instructor._id });
    if (!profile) {
      profile = await InstructorProfile.create({
        userId: instructor._id,
        bio: 'Passionate DevOps instructor with 8+ years of experience in cloud technologies, containerization and automation.',
        expertise: ['DevOps', 'Cloud Computing', 'Docker', 'Kubernetes'],
        skills: ['AWS', 'Linux', 'CI/CD', 'Terraform', 'Ansible'],
        experience: '8+ Years',
        qualifications: ['B.Tech (CSE)', 'AWS Certified Solutions Architect'],
        currentOrganization: 'Tech Solutions Pvt Ltd',
        identityStatus: 'VERIFIED',
        verificationStatus: 'UNDER_REVIEW',
        kycStatus: 'NOT_STARTED',
        payoutStatus: 'NOT_CONNECTED',
      });
    }

    // Check if courses already exist
    const existingCoursesCount = await Course.countDocuments();
    if (existingCoursesCount < 4) {
      console.log('Seeding courses, modules, topics & lessons...');

      const sampleCourses = [
        {
          title: 'DevOps Training',
          slug: 'devops-training',
          shortDescription: 'Learn DevOps from basics to advanced level with real-world examples and industry best practices.',
          description: 'This comprehensive DevOps course covers Linux, Docker, Kubernetes, CI/CD, monitoring and more.',
          thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80',
          instructorId: instructor._id,
          category: 'IT & Software',
          subcategory: 'DevOps',
          level: 'Beginner',
          language: 'English',
          skills: ['DevOps', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'],
          coursePrice: 5999,
          currency: 'INR',
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          publishedAt: new Date(),
          modulesData: [
            {
              title: 'Module 1: Introduction to DevOps',
              topics: [
                { title: 'DevOps Lifecycle & Culture', price: 499, isFree: true, duration: 30 },
                { title: 'Version Control with Git & GitHub', price: 699, isFree: false, duration: 30 },
                { title: 'Continuous Integration Overview', price: 599, isFree: false, duration: 30 },
              ],
            },
            {
              title: 'Module 2: Linux Fundamentals',
              topics: [
                { title: 'Linux Architecture & Commands', price: 499, isFree: true, duration: 45 },
                { title: 'Process Management & Daemons', price: 699, isFree: false, duration: 45 },
                { title: 'Shell Scripting & Automation', price: 799, isFree: false, duration: 60 },
                { title: 'Networking & SSH Security', price: 599, isFree: false, duration: 50 },
              ],
            },
            {
              title: 'Module 3: Docker Containers',
              topics: [
                { title: 'Docker Architecture & Images', price: 599, isFree: true, duration: 45 },
                { title: 'Docker Compose & Multi-Container', price: 799, isFree: false, duration: 60 },
                { title: 'Container Networking & Volumes', price: 699, isFree: false, duration: 60 },
              ],
            },
            {
              title: 'Module 4: Kubernetes',
              topics: [
                { title: 'Kubernetes Cluster Setup', price: 899, isFree: false, duration: 60 },
                { title: 'Pods, Deployments & Services', price: 999, isFree: false, duration: 70 },
                { title: 'ConfigMaps, Secrets & Ingress', price: 899, isFree: false, duration: 60 },
              ],
            },
          ],
        },
        {
          title: 'Cloud Computing & AWS Architecture',
          slug: 'cloud-computing-aws',
          shortDescription: 'Master cloud concepts with real-world architectural design and certification guidance.',
          description: 'Deep dive into AWS services including EC2, S3, RDS, Lambda, VPC and IAM security.',
          thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
          instructorId: instructor._id,
          category: 'Cloud Computing',
          subcategory: 'AWS',
          level: 'Intermediate',
          language: 'English',
          skills: ['AWS', 'Cloud Architecture', 'Serverless', 'Security'],
          coursePrice: 4999,
          currency: 'INR',
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          publishedAt: new Date(),
          modulesData: [
            {
              title: 'Module 1: AWS Fundamentals & IAM',
              topics: [
                { title: 'Cloud Models & AWS Global Infrastructure', price: 399, isFree: true, duration: 30 },
                { title: 'IAM Roles, Users & Policies', price: 599, isFree: false, duration: 45 },
              ],
            },
            {
              title: 'Module 2: Compute & Storage (EC2 & S3)',
              topics: [
                { title: 'EC2 Instances, AMIs & Auto Scaling', price: 699, isFree: false, duration: 60 },
                { title: 'S3 Buckets, Lifecycle & Permissions', price: 599, isFree: false, duration: 45 },
              ],
            },
          ],
        },
        {
          title: 'Full Stack Web Development (MERN)',
          slug: 'full-stack-web-development-mern',
          shortDescription: 'Build modern web applications from scratch with React, Node.js, Express & MongoDB.',
          description: 'Hands-on projects covering full stack TypeScript, Tailwind CSS, REST APIs, and JWT authentication.',
          thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
          instructorId: instructor._id,
          category: 'Development',
          subcategory: 'Full Stack',
          level: 'Intermediate',
          language: 'English',
          skills: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
          coursePrice: 6999,
          currency: 'INR',
          status: 'DRAFT',
          visibility: 'PUBLIC',
          modulesData: [
            {
              title: 'Module 1: React & Modern Frontend',
              topics: [
                { title: 'React Hooks & State Management', price: 699, isFree: true, duration: 60 },
                { title: 'Tailwind CSS UI Design', price: 499, isFree: false, duration: 45 },
              ],
            },
          ],
        },
        {
          title: 'Kubernetes Masterclass',
          slug: 'kubernetes-masterclass',
          shortDescription: 'Deploy and manage applications at enterprise scale with production Kubernetes.',
          description: 'Advanced Helm charts, CI/CD GitOps pipelines, Service Meshes, and Cluster Observability.',
          thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80',
          instructorId: instructor._id,
          category: 'IT & Software',
          subcategory: 'DevOps',
          level: 'Advanced',
          language: 'English',
          skills: ['Kubernetes', 'Helm', 'GitOps', 'Prometheus'],
          coursePrice: 7999,
          currency: 'INR',
          status: 'UNDER_REVIEW',
          visibility: 'PUBLIC',
          modulesData: [
            {
              title: 'Module 1: Enterprise Kubernetes Architecture',
              topics: [
                { title: 'Control Plane & Worker Architecture', price: 799, isFree: true, duration: 45 },
                { title: 'Production HA Cluster Setup', price: 999, isFree: false, duration: 75 },
              ],
            },
          ],
        },
      ];

      for (const cData of sampleCourses) {
        const { modulesData, ...courseInfo } = cData;
        const newCourse = await Course.create(courseInfo);

        for (let mIdx = 0; mIdx < modulesData.length; mIdx++) {
          const modInfo = modulesData[mIdx];
          const newMod = await Module.create({
            courseId: newCourse._id,
            title: modInfo.title,
            order: mIdx + 1,
            status: 'PUBLISHED',
          });

          for (let tIdx = 0; tIdx < modInfo.topics.length; tIdx++) {
            const topInfo = modInfo.topics[tIdx];
            const newTop = await Topic.create({
              moduleId: newMod._id,
              courseId: newCourse._id,
              title: topInfo.title,
              price: topInfo.price,
              isFree: topInfo.isFree,
              duration: topInfo.duration,
              order: tIdx + 1,
              status: 'PUBLISHED',
            });

            // Create 2 lessons per topic
            await Lesson.create({
              topicId: newTop._id,
              title: `${topInfo.title} - Video Lecture`,
              duration: Math.round(topInfo.duration * 0.7),
              order: 1,
              status: 'PUBLISHED',
            });
            await Lesson.create({
              topicId: newTop._id,
              title: `${topInfo.title} - Lab & Code Exercise`,
              duration: Math.round(topInfo.duration * 0.3),
              order: 2,
              status: 'PUBLISHED',
            });
          }
        }
      }
    }

    // Check & Seed Webinars
    const webinarCount = await Webinar.countDocuments({ instructorId: instructor._id });
    if (webinarCount === 0) {
      console.log('Seeding webinars...');
      await Webinar.create([
        {
          title: 'Kubernetes for Beginners',
          slug: 'kubernetes-for-beginners',
          instructorId: instructor._id,
          category: 'DevOps / Cloud',
          startTime: new Date(Date.now() + 86400000 * 2),
          endTime: new Date(Date.now() + 86400000 * 2 + 7200000),
          capacity: 200,
          price: 0,
          status: 'SCHEDULED',
          thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=400&q=80',
        },
        {
          title: 'Docker Deep Dive & Multi-Stage Builds',
          slug: 'docker-deep-dive',
          instructorId: instructor._id,
          category: 'Docker / Containers',
          startTime: new Date(Date.now() + 86400000 * 5),
          endTime: new Date(Date.now() + 86400000 * 5 + 5400000),
          capacity: 150,
          price: 499,
          status: 'SCHEDULED',
          thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=400&q=80',
        },
        {
          title: 'CI/CD Pipeline Setup with GitHub Actions',
          slug: 'cicd-pipeline-setup',
          instructorId: instructor._id,
          category: 'Automation / DevOps',
          startTime: new Date(Date.now() + 86400000 * 9),
          endTime: new Date(Date.now() + 86400000 * 9 + 7200000),
          capacity: 100,
          price: 0,
          status: 'SCHEDULED',
          thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80',
        },
      ]);
    }

    // Check & Seed Q&A
    const questionCount = await CommunityQuestion.countDocuments();
    if (questionCount === 0) {
      console.log('Seeding student questions...');
      const devOpsCourse = await Course.findOne({ slug: 'devops-training' });
      if (devOpsCourse) {
        const q1 = await CommunityQuestion.create({
          userId: instructor._id,
          courseId: devOpsCourse._id,
          question: 'What is the difference between Docker Compose and Kubernetes for container orchestration?',
          status: 'OPEN',
        });
        const q2 = await CommunityQuestion.create({
          userId: instructor._id,
          courseId: devOpsCourse._id,
          question: 'How can we set environment variables in GitHub Actions workflow files securely?',
          status: 'ANSWERED',
        });
        await Answer.create({
          questionId: q2._id,
          userId: instructor._id,
          answer: 'You can use GitHub Encrypted Secrets and access them using ${{ secrets.SECRET_NAME }} syntax in your YAML workflow.',
          isAccepted: true,
        });
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedData();
