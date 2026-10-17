/**
 * Instructor Application Readiness Scoring Engine
 * 
 * Policy Version: 1.0
 * 
 * Evaluates candidate completeness across 6 structured categories (100 pts total):
 * 1. Core Profile: 30 pts
 * 2. Skills & Teaching Subjects: 15 pts
 * 3. Experience & Professional Bio: 15 pts
 * 4. Professional Links (LinkedIn, GitHub/Portfolio): 10 pts
 * 5. Government ID & Required Document Completeness: 20 pts
 * 6. Supporting Evidence (Employment Proof, Certifications): 10 pts
 * 
 * CRITICAL BUSINESS RULE:
 * Numerical score is gated behind verified backend payment (registrationFeePaid === true).
 * Pre-payment requests only receive guidance (missing items and next steps).
 */

export class ReadinessScoringService {
  static SCORING_VERSION = '1.0';

  /**
   * Helper to validate HTTP/HTTPS URLs
   */
  static isValidUrl(string) {
    if (!string || typeof string !== 'string') return false;
    try {
      const url = new URL(string.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  /**
   * Compute category scores and dynamic recommendations
   */
  static evaluateApplication(profile = {}, user = {}) {
    const missingItems = [];
    const recommendations = [];

    // ---------------------------------------------------------
    // 1. Core Professional Profile (Max: 30 pts)
    // ---------------------------------------------------------
    let coreProfile = 0;

    // 1a. Name & Photo (10 pts)
    const hasName = Boolean(user.firstName || user.lastName || profile.fullName);
    const hasPhoto = Boolean(user.profilePhoto || profile.profilePhoto);
    if (hasName && hasPhoto) {
      coreProfile += 10;
    } else if (hasName) {
      coreProfile += 6;
      missingItems.push('Profile Photo');
      recommendations.push('Upload a high-quality professional headshot to increase learner trust.');
    } else {
      missingItems.push('Full Legal Name');
    }

    // 1b. Organization & Job Title (10 pts)
    const isEmployed = profile.isEmployed !== false;
    const hasOrg = Boolean(profile.currentOrganization && profile.currentOrganization.trim());
    const hasTitle = Boolean(profile.currentJobTitle && profile.currentJobTitle.trim());

    if (!isEmployed) {
      // Explicit independent/freelancer/consultant: full points if title given
      if (hasTitle) {
        coreProfile += 10;
      } else {
        coreProfile += 5;
        missingItems.push('Current Professional Title (e.g. Independent Tech Consultant)');
      }
    } else {
      if (hasOrg && hasTitle) {
        coreProfile += 10;
      } else if (hasTitle || hasOrg) {
        coreProfile += 6;
        if (!hasOrg) missingItems.push('Current Organization / Employer');
        if (!hasTitle) missingItems.push('Current Job Title');
      } else {
        missingItems.push('Current Company and Job Title');
      }
    }

    // 1c. Contact & Location Verified (10 pts)
    const hasPhone = Boolean(user.phone || profile.phone);
    const hasCountry = Boolean(user.country || profile.country);
    if (hasPhone && hasCountry) {
      coreProfile += 10;
    } else if (hasPhone || hasCountry) {
      coreProfile += 5;
      if (!hasPhone) missingItems.push('Phone Number');
      if (!hasCountry) missingItems.push('Country / Operational Region');
    } else {
      missingItems.push('Contact Phone & Country');
    }

    // ---------------------------------------------------------
    // 2. Skills & Teaching Subjects (Max: 15 pts)
    // ---------------------------------------------------------
    let skillsAndSubjects = 0;

    const skills = Array.isArray(profile.expertise) && profile.expertise.length > 0
      ? profile.expertise
      : (Array.isArray(profile.skills) ? profile.skills : []);

    const subjects = Array.isArray(profile.teachingSubjects)
      ? profile.teachingSubjects
      : [];

    if (skills.length >= 3) {
      skillsAndSubjects += 8;
    } else if (skills.length >= 1) {
      skillsAndSubjects += 5;
      recommendations.push('Add at least 3 core technical competencies or tools.');
    } else {
      missingItems.push('Core Technical Skills');
    }

    if (subjects.length >= 1) {
      skillsAndSubjects += 7;
    } else {
      missingItems.push('Target Teaching Subjects');
      recommendations.push('Specify at least 1 course or subject area you plan to teach.');
    }

    // ---------------------------------------------------------
    // 3. Experience & Professional Bio (Max: 15 pts)
    // ---------------------------------------------------------
    let experienceAndBio = 0;

    const bio = (profile.bio || user.bio || '').trim();
    if (bio.length >= 100) {
      experienceAndBio += 8;
    } else if (bio.length >= 25) {
      experienceAndBio += 5;
      recommendations.push('Expand your professional biography to highlight your industry achievements.');
    } else {
      missingItems.push('Professional Biography (minimum 25 characters)');
    }

    const expVal = parseInt(profile.yearsOfExperience || profile.experience || '0', 10);
    if (expVal >= 3) {
      experienceAndBio += 7;
    } else if (expVal > 0) {
      experienceAndBio += 5;
    } else {
      missingItems.push('Years of Experience');
    }

    // ---------------------------------------------------------
    // 4. Professional Links (Max: 10 pts)
    // ---------------------------------------------------------
    let professionalLinks = 0;

    const hasLinkedIn = this.isValidUrl(profile.linkedinUrl) && profile.linkedinUrl.includes('linkedin.com');
    const hasGitHubOrPort = this.isValidUrl(profile.githubUrl) || this.isValidUrl(profile.portfolioUrl);

    if (hasLinkedIn) {
      professionalLinks += 6;
    } else {
      missingItems.push('LinkedIn Profile URL');
      recommendations.push('Add your verified LinkedIn profile URL to boost your professional credibility.');
    }

    if (hasGitHubOrPort) {
      professionalLinks += 4;
    } else {
      recommendations.push('Link your GitHub, GitLab, or personal portfolio site to showcase practical code or projects.');
    }

    // ---------------------------------------------------------
    // 5. Government ID & Required Document Completeness (Max: 20 pts)
    // ---------------------------------------------------------
    let governmentIdAndRequiredDocs = 0;

    const govId = profile.governmentId || {};
    const hasGovId = Boolean(govId.documentUrl && govId.status !== 'INVALID' && govId.status !== 'REJECTED');

    if (hasGovId) {
      governmentIdAndRequiredDocs += 12;
    } else {
      missingItems.push('Government-Issued ID Proof (Passport, Driving License, or National ID)');
      recommendations.push('Upload a clear scan of your government-issued ID for identity verification.');
    }

    const verificationDocs = Array.isArray(profile.verificationDocuments) ? profile.verificationDocuments : [];
    const resumeDoc = verificationDocs.find((d) => d.documentType === 'RESUME_CV' && d.status !== 'INVALID' && d.status !== 'REJECTED');

    if (resumeDoc) {
      governmentIdAndRequiredDocs += 8;
    } else {
      missingItems.push('Current Resume / Curriculum Vitae (PDF)');
      recommendations.push('Upload an up-to-date resume in PDF format.');
    }

    // ---------------------------------------------------------
    // 6. Supporting Evidence (Max: 10 pts)
    // ---------------------------------------------------------
    let supportingEvidence = 0;

    const supportingDocs = verificationDocs.filter(
      (d) => ['EMPLOYMENT_PROOF', 'EXPERIENCE_LETTER', 'CERTIFICATION'].includes(d.documentType) &&
             d.status !== 'INVALID' && d.status !== 'REJECTED'
    );

    if (supportingDocs.length >= 1) {
      supportingEvidence += 10;
    } else {
      recommendations.push('Attach an employment certificate, work ID, or professional certification to achieve 100% readiness.');
    }

    // Total Score (0 - 100)
    const totalScore = Math.min(
      100,
      coreProfile +
      skillsAndSubjects +
      experienceAndBio +
      professionalLinks +
      governmentIdAndRequiredDocs +
      supportingEvidence
    );

    return {
      score: totalScore,
      breakdown: {
        coreProfile,
        skillsAndSubjects,
        experienceAndBio,
        professionalLinks,
        governmentIdAndRequiredDocs,
        supportingEvidence,
      },
      missingItems,
      recommendations,
      scoringRuleVersion: this.SCORING_VERSION,
      calculatedAt: new Date(),
    };
  }

  /**
   * Check if profile has uploaded all required items prior to allowing payment order
   */
  static isProfileReadyForPayment(profile = {}, user = {}) {
    const missingPrerequisites = [];

    const hasName = Boolean(user.firstName || user.lastName || profile.fullName);
    if (!hasName) missingPrerequisites.push('Full Legal Name');

    const bio = (profile.bio || user.bio || '').trim();
    if (bio.length < 20) missingPrerequisites.push('Professional Bio (min 20 characters)');

    const skills = Array.isArray(profile.expertise) && profile.expertise.length > 0
      ? profile.expertise
      : (Array.isArray(profile.skills) ? profile.skills : []);
    if (skills.length === 0) missingPrerequisites.push('At least one Skill or Expertise area');

    const isEmployed = profile.isEmployed !== false;
    if (isEmployed && !profile.currentOrganization?.trim()) {
      missingPrerequisites.push('Current Organization (or mark as Independent / Freelance)');
    }

    if (!profile.currentJobTitle?.trim()) {
      missingPrerequisites.push('Current Professional Job Title');
    }

    const govId = profile.governmentId || {};
    if (!govId.documentUrl) {
      missingPrerequisites.push('Government-Issued ID Proof document');
    }

    const verificationDocs = Array.isArray(profile.verificationDocuments) ? profile.verificationDocuments : [];
    const hasResume = verificationDocs.some((d) => d.documentType === 'RESUME_CV' && Boolean(d.fileUrl));
    if (!hasResume) {
      missingPrerequisites.push('Resume / CV document');
    }

    return {
      isReady: missingPrerequisites.length === 0,
      missingPrerequisites,
    };
  }

  /**
   * Get Readiness Report with Quality Prediction & Transparency
   * Provides predicted approval likelihood and lagging fields so candidates know where they stand.
   */
  static getGatedReadinessReport(profile = {}, user = {}) {
    const isPaid = Boolean(profile.registrationFeePaid || user.registrationFeePaid);
    const evaluation = this.evaluateApplication(profile, user);
    const approvalChance = evaluation.score >= 80 ? 'High' : evaluation.score >= 55 ? 'Moderate' : 'Low';

    if (!isPaid) {
      return {
        isPaid: false,
        isScoreLocked: true,
        score: evaluation.score,
        predictedScore: evaluation.score,
        approvalChance,
        approvalProbability: evaluation.score,
        breakdown: evaluation.breakdown,
        missingItems: evaluation.missingItems,
        laggingFields: evaluation.missingItems,
        recommendations: evaluation.recommendations,
        guidance: {
          missingItems: evaluation.missingItems,
          recommendations: evaluation.recommendations,
          completedCount: 6 - (evaluation.missingItems.length > 0 ? 1 : 0),
          message: 'Your predicted readiness score is shown below. Complete any lagging items to maximize your chances of admin approval.',
        },
        readinessStatus: evaluation.score >= 80 ? 'HIGH' : evaluation.score >= 50 ? 'MODERATE' : 'INCOMPLETE',
      };
    }

    return {
      isPaid: true,
      isScoreLocked: false,
      score: evaluation.score,
      predictedScore: evaluation.score,
      approvalChance,
      approvalProbability: evaluation.score,
      breakdown: evaluation.breakdown,
      missingItems: evaluation.missingItems,
      laggingFields: evaluation.missingItems,
      recommendations: evaluation.recommendations,
      scoringRuleVersion: evaluation.scoringRuleVersion,
      calculatedAt: evaluation.calculatedAt,
      readinessStatus: evaluation.score >= 80 ? 'HIGH' : evaluation.score >= 50 ? 'MODERATE' : 'INCOMPLETE',
    };
  }
}
