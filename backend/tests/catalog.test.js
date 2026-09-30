import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { CatalogService } from '../src/modules/catalog/catalog.service.js';
import app from '../src/app.js';

describe('Edutech LMS — Catalog & Dynamic Data Audit Test Suite', () => {
  before(async () => {
    await connectDB();
  });

  after(async () => {
    await disconnectDB();
  });

  it('1. Should fetch dynamic courses list from MongoDB with proper structure', async () => {
    const result = await CatalogService.getCourses({ limit: 10, page: 1 });
    assert.ok(result);
    assert.ok(Array.isArray(result.courses), 'courses should be an array');
    assert.ok(typeof result.total === 'number', 'total should be a number');
    assert.ok(result.courses.length > 0, 'should return active courses from DB');

    const firstCourse = result.courses[0];
    assert.ok(firstCourse.id, 'course should have id');
    assert.ok(firstCourse.title, 'course should have title');
    assert.ok(firstCourse.category, 'course should have category');
    assert.ok(typeof firstCourse.price === 'number', 'course should have numeric price');
    assert.ok(typeof firstCourse.totalTopics === 'number', 'totalTopics should be calculated');
    assert.ok(typeof firstCourse.totalModules === 'number', 'totalModules should be calculated');
  });

  it('2. Should fetch course detail by slug or ID with structured curriculum', async () => {
    const listResult = await CatalogService.getCourses({ limit: 1 });
    const course = listResult.courses[0];
    assert.ok(course, 'Need at least one course');

    const detail = await CatalogService.getCourseBySlug(course.slug || course.id);
    assert.ok(detail, 'Should find course detail');
    assert.equal(detail.id, course.id);
    assert.ok(Array.isArray(detail.curriculum), 'curriculum should be an array');
    assert.ok(detail.instructor, 'instructor should be populated');
    assert.ok(typeof detail.totalLessons === 'number', 'totalLessons should be counted');
  });

  it('3. Should return null for non-existent course slug/id', async () => {
    const detail = await CatalogService.getCourseBySlug('non-existent-course-slug-12345');
    assert.equal(detail, null, 'Non-existent course should return null');
  });

  it('4. Should fetch dynamic topics list from MongoDB with course mapping', async () => {
    const topics = await CatalogService.getTopics({ limit: 10 });
    assert.ok(Array.isArray(topics), 'topics should be an array');
    if (topics.length > 0) {
      const topic = topics[0];
      assert.ok(topic.id, 'topic should have id');
      assert.ok(topic.title, 'topic should have title');
      assert.ok(typeof topic.price === 'number', 'topic price should be number');
      assert.ok(topic.courseTitle, 'topic should map to courseTitle');
    }
  });

  it('5. Should fetch dynamic webinars list from MongoDB', async () => {
    const webinars = await CatalogService.getWebinars({ limit: 10 });
    assert.ok(Array.isArray(webinars), 'webinars should be an array');
    if (webinars.length > 0) {
      const webinar = webinars[0];
      assert.ok(webinar.id, 'webinar should have id');
      assert.ok(webinar.title, 'webinar should have title');
      assert.ok(webinar.instructorName, 'webinar should have instructorName');
    }
  });

  it('6. Should fetch dynamic instructors list from MongoDB', async () => {
    const instructors = await CatalogService.getInstructors({ limit: 10 });
    assert.ok(Array.isArray(instructors), 'instructors should be an array');
    if (instructors.length > 0) {
      const inst = instructors[0];
      assert.ok(inst.id, 'instructor should have id');
      assert.ok(inst.name, 'instructor should have name');
      assert.ok(typeof inst.courseCount === 'number', 'instructor should have dynamic courseCount');
    }
  });

  it('7. Should fetch dynamic learning paths from MongoDB', async () => {
    const paths = await CatalogService.getLearningPaths({ limit: 10 });
    assert.ok(Array.isArray(paths), 'learning paths should be an array');
  });

  it('8. Should dynamically aggregate category course counts from MongoDB', async () => {
    const categories = await CatalogService.getCategories();
    assert.ok(Array.isArray(categories), 'categories should be an array');
    assert.ok(categories.length > 0, 'should have at least one category');
    assert.ok(categories[0].name, 'category should have name');
    assert.ok(typeof categories[0].coursesCountNumber === 'number', 'coursesCountNumber should be number');
  });

  it('9. Should calculate live platform statistics from MongoDB', async () => {
    const stats = await CatalogService.getPublicStats();
    assert.ok(Array.isArray(stats), 'stats should be an array');
    assert.ok(stats.length >= 4, 'should return at least 4 stats metrics');
    const learners = stats.find((s) => s.label === 'Active Learners');
    assert.ok(learners, 'Should include Active Learners metric');
    const catalog = stats.find((s) => s.label === 'Catalog Courses');
    assert.ok(catalog, 'Should include Catalog Courses metric');
  });
});
