#!/usr/bin/env node

/**
 * Automated End-to-End Test for Onboarding System
 * Tests: Form submissions, percentage tracking, Google Sheets logging
 *
 * Requirements:
 * - npm install puppeteer
 * - Run after deploying to Vercel
 *
 * Usage: node test-automation.js
 */

const puppeteer = require('puppeteer');

const TEST_URL = process.env.TEST_URL || 'https://onboarding-6th-ave.vercel.app';
const TEST_EMAIL = `test-${Date.now()}@audit.com`;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🚀 Starting Automated End-to-End Tests');
  console.log(`📍 Target: ${TEST_URL}`);
  console.log(`📧 Test Email: ${TEST_EMAIL}`);
  console.log('---\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    // Test 1: Page 1 - AgentInfoForm
    console.log('📋 TEST 1: AgentInfoForm (Page 1)');
    await page.goto(`${TEST_URL}/page/1`);
    await page.waitForSelector('input[name="firstName"]');

    const percentage1 = await page.evaluate(() => {
      const percentText = document.querySelector('[class*="text-brand-coral"]')?.textContent || '0%';
      return percentText.match(/\d+/)?.[0] || '0';
    });
    console.log(`  Initial percentage: ${percentage1}%`);

    // Fill agent info
    await page.type('input[name="firstName"]', 'TestAgent');
    await page.type('input[name="lastName"]', 'Testing');
    await page.type('input[name="email"]', TEST_EMAIL);
    await page.click('button[type="submit"]');
    await wait(1000);

    const percentage2 = await page.evaluate(() => {
      const percentText = document.querySelector('[class*="text-brand-coral"]')?.textContent || '0%';
      return percentText.match(/\d+/)?.[0] || '0';
    });
    console.log(`  After AgentInfo: ${percentage2}%`);
    if (percentage2 >= 2) {
      console.log('  ✅ AgentInfoForm tracked correctly\n');
    } else {
      console.log('  ❌ AgentInfoForm not tracked\n');
    }

    // Test 2: Page 2 - Emergency Contact Form
    console.log('📋 TEST 2: Emergency Contact Form (Page 2)');
    await page.click('a[href="/page/2"]');
    await page.waitForSelector('input[name="trecLicenseNumber"]');

    // Fill emergency contact form
    await page.type('input[name="trecLicenseNumber"]', 'TX123456');
    await page.type('input[name="cellPhone"]', '5551234567');
    await page.type('input[name="emergencyContactName"]', 'Jane Doe');
    await page.type('input[name="emergencyContactPhone"]', '5559876543');
    await page.type('input[name="emergencyContactEmail"]', 'jane@test.com');

    // Set date fields
    await page.type('input[name="licenseExpiry"]', '12312026');
    await page.type('input[name="birthday"]', '01011990');
    await page.type('input[name="homeAddressStreet"]', '123 Main');
    await page.type('input[name="homeAddressCity"]', 'Austin');
    await page.type('input[name="homeAddressZip"]', '78701');

    // Check location access checkbox
    const checkbox = await page.$('input[name="hasLocationAccess"]');
    if (checkbox) {
      await checkbox.click();
      console.log('  ✓ Checked location access');
    }

    // Submit form
    await page.click('button:contains("Submit Emergency Contact")');
    await wait(2000);

    const percentage3 = await page.evaluate(() => {
      const percentText = document.querySelector('[class*="text-brand-coral"]')?.textContent || '0%';
      return percentText.match(/\d+/)?.[0] || '0';
    });
    console.log(`  After Emergency Contact: ${percentage3}%`);
    if (percentage3 > percentage2) {
      console.log('  ✅ Emergency Contact form tracked\n');
    } else {
      console.log('  ❌ Emergency Contact form not tracked\n');
    }

    // Test 3: Page 3 - Bio Form
    console.log('📋 TEST 3: Bio Form (Page 3)');
    await page.click('a[href="/page/3"]');
    await page.waitForSelector('textarea');

    const bioText = 'This is a test bio. ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(3);
    await page.type('textarea', bioText);
    await page.click('button:contains("Submit")');
    await wait(2000);

    const percentage4 = await page.evaluate(() => {
      const percentText = document.querySelector('[class*="text-brand-coral"]')?.textContent || '0%';
      return percentText.match(/\d+/)?.[0] || '0';
    });
    console.log(`  After Bio Form: ${percentage4}%`);
    if (percentage4 > percentage3) {
      console.log('  ✅ Bio form tracked\n');
    } else {
      console.log('  ❌ Bio form not tracked\n');
    }

    // Test 4: Checkbox tracking
    console.log('📋 TEST 4: Checkbox Tracking');
    const checkboxElements = await page.$$('input[type="checkbox"][class*="page-checkbox"]');
    console.log(`  Found ${checkboxElements.length} checkboxes on page 3`);

    if (checkboxElements.length > 0) {
      await checkboxElements[0].click();
      await wait(1500);

      const percentage5 = await page.evaluate(() => {
        const percentText = document.querySelector('[class*="text-brand-coral"]')?.textContent || '0%';
        return percentText.match(/\d+/)?.[0] || '0';
      });
      console.log(`  After checking 1 checkbox: ${percentage5}%`);
      if (percentage5 > percentage4) {
        console.log('  ✅ Checkbox tracking works\n');
      } else {
        console.log('  ❌ Checkbox tracking failed\n');
      }
    }

    // Final summary
    console.log('📊 FINAL SUMMARY');
    console.log(`  Initial: ${percentage1}%`);
    console.log(`  After AgentInfo: ${percentage2}%`);
    console.log(`  After Emergency Contact: ${percentage3}%`);
    console.log(`  After Bio: ${percentage4}%`);
    console.log(`  System operational: ${percentage4 > 10 ? '✅ YES' : '❌ NO'}`);

    console.log('\n🎯 Google Sheets Verification:');
    console.log(`  Check sheet for data with email: ${TEST_EMAIL}`);
    console.log('  Verify: AgentInfo, Emergency Contact, Bio forms all saved');
    console.log('  Check: Location Access field saved correctly\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('✨ Test automation complete!');
}

runTests();
