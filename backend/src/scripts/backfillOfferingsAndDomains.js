import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  LearningPath,
  LearningPathDomain,
  LearningPathDomainTopic,
  Course,
  Module,
  Topic,
  Lesson,
  TopicContentOffering,
  User,
  InstructorProfile,
} from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { connectDB } from '../config/db.js';

async function runBackfill() {
  console.log('--- Starting Industry-Grade Learning Path & Offerings Backfill ---');
  await connectDB();
  console.log('[Database] Connected to MongoDB Atlas successfully.');

  try {
    // 1. Fetch all Instructors
    const instructors = await User.find({ role: 'INSTRUCTOR' }).lean();
    console.log(`Found ${instructors.length} instructors.`);

    // 2. Fetch all Courses with Topics and Modules
    const courses = await Course.find({}).lean();
    console.log(`Found ${courses.length} courses.`);

    const topics = await Topic.find({}).lean();
    console.log(`Found ${topics.length} topics.`);

    const lessons = await Lesson.find({}).lean();
    console.log(`Found ${lessons.length} lessons.`);

    // 3. For every Topic, ensure it has published TopicContentOffering records
    let offeringsCreated = 0;
    let lessonsLinked = 0;

    for (const top of topics) {
      const parentCourse = courses.find((c) => c._id.toString() === top.courseId?.toString());
      const primaryInstructorId = parentCourse?.instructorId || instructors[0]?._id;

      if (!primaryInstructorId) continue;

      // Find lessons for this topic
      const topicLessons = lessons.filter((l) => l.topicId.toString() === top._id.toString());
      const totalDurationSec = topicLessons.reduce((acc, l) => acc + (l.duration || 0), 0);

      // Check if primary offering exists
      let primaryOffering = await TopicContentOffering.findOne({
        topicId: top._id,
        instructorId: primaryInstructorId,
      });

      const basePrice = top.price && top.price > 0 ? top.price : 799;

      if (!primaryOffering) {
        primaryOffering = await TopicContentOffering.create({
          offeringId: `OFF-${top._id.toString().slice(-6)}-1`,
          topicId: top._id,
          courseId: top.courseId,
          instructorId: primaryInstructorId,
          title: `${top.title} — Comprehensive Masterclass`,
          slug: `${top.slug || top.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-masterclass`,
          description: top.description || `In-depth practical curriculum covering ${top.title} with real-world projects and guided labs.`,
          shortDescription: `Master ${top.title} with industry best practices and hands-on exercises.`,
          price: basePrice, // Authoritative price
          currency: 'INR',
          duration: totalDurationSec || (top.duration ? top.duration * 60 : 3600),
          durationMinutes: Math.round((totalDurationSec || (top.duration ? top.duration * 60 : 3600)) / 60),
          contentType: 'VIDEO_SERIES',
          status: 'PUBLISHED',
          publicationState: 'PUBLISHED',
          isPreviewAvailable: true,
          skills: Array.isArray(top.skills) ? top.skills : [],
          learningObjectives: Array.isArray(top.learningObjectives) && top.learningObjectives.length > 0
            ? top.learningObjectives
            : [`Understand core mechanics of ${top.title}`, `Implement real-world solutions with ${top.title}`, `Master troubleshooting and optimization`],
          prerequisites: Array.isArray(top.prerequisites) ? top.prerequisites : ['Basic programming knowledge'],
          level: top.difficulty || 'ALL_LEVELS',
        });
        offeringsCreated++;
      }

      // Link lessons to this offering if not already linked
      for (const les of topicLessons) {
        if (!les.contentOfferingId) {
          await Lesson.updateOne(
            { _id: les._id },
            { $set: { contentOfferingId: primaryOffering._id, courseId: top.courseId } }
          );
          lessonsLinked++;
        }
      }

      // To demonstrate multi-tutor marketplace dynamics on select key topics, create secondary/tertiary tutor offerings from other instructors
      if (instructors.length > 1) {
        const otherInstructors = instructors.filter(
          (inst) => inst._id.toString() !== primaryInstructorId.toString()
        );

        const sampleAlternateTutors = [
          {
            inst: otherInstructors[0],
            titleSuffix: '— Production & Advanced Architecture',
            priceOffset: 400,
            desc: `Production-grade patterns, enterprise scalability, and advanced best practices for ${top.title}.`,
          },
          {
            inst: otherInstructors[1] || otherInstructors[0],
            titleSuffix: '— Zero to Hero Crash Course',
            priceOffset: -200,
            desc: `Rapid, focused crash course designed to get you up and running with ${top.title} in minimal time.`,
          },
        ];

        for (let i = 0; i < sampleAlternateTutors.length; i++) {
          const alt = sampleAlternateTutors[i];
          if (!alt.inst) continue;

          const altOfferingExists = await TopicContentOffering.findOne({
            topicId: top._id,
            instructorId: alt.inst._id,
          });

          if (!altOfferingExists) {
            const altPrice = Math.max(399, basePrice + alt.priceOffset);
            const altOff = await TopicContentOffering.create({
              offeringId: `OFF-${top._id.toString().slice(-6)}-${i + 2}`,
              topicId: top._id,
              courseId: top.courseId,
              instructorId: alt.inst._id,
              title: `${top.title} ${alt.titleSuffix}`,
              slug: `${top.slug || top.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tutor-${i + 2}`,
              description: alt.desc,
              shortDescription: `Focused ${top.title} specialization tailored by ${alt.inst.firstName || 'Industry Expert'}.`,
              price: altPrice,
              currency: 'INR',
              duration: 7200 + i * 1800,
              durationMinutes: 120 + i * 30,
              contentType: 'VIDEO_SERIES',
              status: 'PUBLISHED',
              publicationState: 'PUBLISHED',
              isPreviewAvailable: true,
              skills: Array.isArray(top.skills) ? top.skills : [],
              learningObjectives: [`Deploy production systems using ${top.title}`, `Avoid common pitfalls and security vulnerabilities`],
              prerequisites: ['Basic fundamentals'],
              level: i === 0 ? 'ADVANCED' : 'INTERMEDIATE',
            });
            offeringsCreated++;

            // Create 3-4 dedicated lessons for this alternate tutor offering
            const lessonNames = [
              `1. Introduction & Environment Setup for ${top.title}`,
              `2. Core Architecture & Hands-on Implementation`,
              `3. Production Considerations & Error Handling`,
              `4. Capstone Project Walkthrough`,
            ];

            for (let lIdx = 0; lIdx < lessonNames.length; lIdx++) {
              await Lesson.create({
                lessonId: `LES-${altOff._id.toString().slice(-6)}-${lIdx + 1}`,
                topicId: top._id,
                courseId: top.courseId,
                contentOfferingId: altOff._id,
                title: lessonNames[lIdx],
                duration: 900 + lIdx * 300,
                order: lIdx + 1,
                status: 'PUBLISHED',
                isFreePreview: lIdx === 0, // First lesson free preview
                playbackReference: 'sample_secure_stream.m3u8',
              });
            }
          }
        }
      }
    }

    console.log(`Created ${offeringsCreated} tutor offerings and linked ${lessonsLinked} lessons.`);

    // 4. Populate LearningPathDomains & LearningPathDomainTopics based on actual LearningPaths & Modules
    const learningPaths = await LearningPath.find({}).lean();
    console.log(`Found ${learningPaths.length} learning paths.`);

    for (const lp of learningPaths) {
      // Find modules belonging to courses attached to this learning path, or find all existing modules
      let attachedCourseIds = Array.isArray(lp.courses) && lp.courses.length > 0 ? lp.courses : [];
      if (attachedCourseIds.length === 0) {
        attachedCourseIds = courses.map((c) => c._id);
      }

      const pathModules = await Module.find({ courseId: { $in: attachedCourseIds } })
        .sort({ order: 1 })
        .lean();

      // Create or sync LearningPathDomain for each module
      let dOrder = 1;
      for (const mod of pathModules) {
        let domain = await LearningPathDomain.findOne({
          learningPathId: lp._id,
          title: mod.title,
        });

        if (!domain) {
          domain = await LearningPathDomain.create({
            domainId: `DOM-${lp._id.toString().slice(-4)}-${dOrder}`,
            learningPathId: lp._id,
            title: mod.title,
            slug: mod.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: mod.description || `Master comprehensive skills and best practices in ${mod.title}.`,
            order: dOrder,
            status: 'PUBLISHED',
          });
        }

        // Attach topics under this module into LearningPathDomainTopic
        const moduleTopics = topics.filter((t) => t.moduleId?.toString() === mod._id.toString());
        let tOrder = 1;
        for (const mt of moduleTopics) {
          const existingLink = await LearningPathDomainTopic.findOne({
            learningPathId: lp._id,
            domainId: domain._id,
            topicId: mt._id,
          });

          if (!existingLink) {
            await LearningPathDomainTopic.create({
              learningPathId: lp._id,
              domainId: domain._id,
              topicId: mt._id,
              order: tOrder,
              isRequired: true,
              isRecommended: false,
              status: 'ACTIVE',
            });
          }
          tOrder++;
        }

        dOrder++;
      }
    }

    console.log('--- Learning Path & Offerings Backfill Completed Successfully ---');
  } catch (error) {
    console.error('Error during backfill:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB.');
  }
}

runBackfill();
