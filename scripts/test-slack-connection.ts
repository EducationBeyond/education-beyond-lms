import { WebClient } from '@slack/web-api';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const token = process.env.SLACK_BOT_TOKEN;

if (!token) {
  console.error('❌ SLACK_BOT_TOKEN not found in .env');
  process.exit(1);
}

const client = new WebClient(token);

async function testSlackConnection() {
  console.log('🧪 Testing Slack Bot Connection...\n');

  try {
    // 1. Test authentication
    console.log('1️⃣ Testing authentication...');
    const authTest = await client.auth.test();
    console.log('✅ Authentication successful!');
    console.log(`   Bot User ID: ${authTest.user_id}`);
    console.log(`   Bot Name: ${authTest.user}`);
    console.log(`   Team: ${authTest.team}\n`);

    // 2. List all channels the bot can see
    console.log('2️⃣ Listing accessible channels...');
    const channelsList = await client.conversations.list({
      types: 'public_channel,private_channel',
      limit: 100,
    });

    if (channelsList.channels && channelsList.channels.length > 0) {
      console.log(`✅ Found ${channelsList.channels.length} channels:\n`);
      channelsList.channels.forEach((channel: any) => {
        const isMember = channel.is_member ? '✓ (member)' : '✗ (not member)';
        console.log(`   ${isMember} ${channel.name} (ID: ${channel.id})`);
      });
    } else {
      console.log('⚠️  No channels found\n');
    }

    // 3. Test posting to a specific channel (if provided)
    const testChannelId = process.argv[2];
    if (testChannelId) {
      console.log(`\n3️⃣ Testing message post to channel: ${testChannelId}...`);
      try {
        const result = await client.chat.postMessage({
          channel: testChannelId,
          text: '🤖 Test message from Education Beyond LMS',
          username: 'Education Beyond Bot',
        });
        console.log('✅ Message posted successfully!');
        console.log(`   Message TS: ${result.ts}\n`);
      } catch (error: any) {
        console.error('❌ Failed to post message:');
        console.error(`   Error: ${error.message}`);
        if (error.data) {
          console.error(`   Details: ${JSON.stringify(error.data, null, 2)}\n`);
        }
      }
    } else {
      console.log('\n💡 To test posting to a specific channel, run:');
      console.log('   npx tsx scripts/test-slack-connection.ts CHANNEL_ID\n');
    }

    // 4. Check OAuth scopes
    console.log('4️⃣ Checking OAuth scopes...');
    const scopes = (authTest.response_metadata as any)?.scopes || [];
    const requiredScopes = ['chat:write', 'channels:read', 'groups:read'];

    console.log('   Current scopes:', scopes.length > 0 ? scopes : 'Unable to retrieve scopes');
    console.log('\n   Required scopes:');
    requiredScopes.forEach(scope => {
      const hasScope = scopes.includes(scope);
      console.log(`   ${hasScope ? '✅' : '❌'} ${scope}`);
    });

  } catch (error: any) {
    console.error('\n❌ Error testing Slack connection:');
    console.error(`   ${error.message}`);
    if (error.data) {
      console.error(`   Details: ${JSON.stringify(error.data, null, 2)}`);
    }
    process.exit(1);
  }
}

testSlackConnection();
