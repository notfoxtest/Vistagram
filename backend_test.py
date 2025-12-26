import requests
import sys
import json
from datetime import datetime

class EchoSphereAPITester:
    def __init__(self, base_url="https://echosphere-8.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_username = f"testuser_{datetime.now().strftime('%H%M%S')}"
        self.test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        self.test_password = "TestPass123!"
        
        self.server_id = None
        self.channel_id = None
        self.message_id = None
        self.dm_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return response.json() if response.content else {}
                except:
                    return {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return None

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return None

    def test_auth_signup(self):
        """Test user signup"""
        data = {
            "username": self.test_username,
            "email": self.test_email,
            "password": self.test_password
        }
        
        response = self.run_test(
            "User Signup",
            "POST",
            "auth/signup",
            200,
            data,
            auth_required=False
        )
        
        if response and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_auth_login(self):
        """Test user login"""
        data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data,
            auth_required=False
        )
        
        if response and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return response is not None

    def test_create_server(self):
        """Test server creation"""
        data = {
            "name": f"Test Server {datetime.now().strftime('%H%M%S')}",
            "description": "A test server for API testing"
        }
        
        response = self.run_test(
            "Create Server",
            "POST",
            "servers",
            200,
            data
        )
        
        if response and 'id' in response:
            self.server_id = response['id']
            return True
        return False

    def test_get_servers(self):
        """Test get user servers"""
        response = self.run_test(
            "Get User Servers",
            "GET",
            "servers",
            200
        )
        return response is not None

    def test_get_server_channels(self):
        """Test get server channels"""
        if not self.server_id:
            self.log_test("Get Server Channels", False, "No server ID available")
            return False
            
        response = self.run_test(
            "Get Server Channels",
            "GET",
            f"servers/{self.server_id}/channels",
            200
        )
        
        if response and len(response) > 0:
            # Get the first text channel
            for channel in response:
                if channel.get('channel_type') == 'text':
                    self.channel_id = channel['id']
                    break
            return True
        return False

    def test_create_channel(self):
        """Test channel creation"""
        if not self.server_id:
            self.log_test("Create Channel", False, "No server ID available")
            return False
            
        data = {
            "name": f"test-channel-{datetime.now().strftime('%H%M%S')}",
            "channel_type": "text",
            "server_id": self.server_id
        }
        
        response = self.run_test(
            "Create Channel",
            "POST",
            "channels",
            200,
            data
        )
        
        if response and 'id' in response:
            if not self.channel_id:  # Use this as primary channel if none set
                self.channel_id = response['id']
            return True
        return False

    def test_send_message(self):
        """Test sending a message"""
        if not self.channel_id:
            self.log_test("Send Message", False, "No channel ID available")
            return False
            
        data = {
            "content": f"Test message sent at {datetime.now().isoformat()}",
            "channel_id": self.channel_id
        }
        
        response = self.run_test(
            "Send Message",
            "POST",
            "messages",
            200,
            data
        )
        
        if response and 'id' in response:
            self.message_id = response['id']
            return True
        return False

    def test_get_messages(self):
        """Test getting channel messages"""
        if not self.channel_id:
            self.log_test("Get Messages", False, "No channel ID available")
            return False
            
        response = self.run_test(
            "Get Channel Messages",
            "GET",
            f"channels/{self.channel_id}/messages",
            200
        )
        return response is not None

    def test_create_dm(self):
        """Test creating a DM (with self for testing)"""
        if not self.user_id:
            self.log_test("Create DM", False, "No user ID available")
            return False
            
        data = {
            "recipient_id": self.user_id  # DM with self for testing
        }
        
        response = self.run_test(
            "Create DM",
            "POST",
            "dms",
            200,
            data
        )
        
        if response and 'id' in response:
            self.dm_id = response['id']
            return True
        return False

    def test_get_dms(self):
        """Test getting user DMs"""
        response = self.run_test(
            "Get User DMs",
            "GET",
            "dms",
            200
        )
        return response is not None

    def test_search_users(self):
        """Test user search"""
        response = self.run_test(
            "Search Users",
            "GET",
            f"search/users?q={self.test_username[:5]}",
            200
        )
        return response is not None

    def test_discover_servers(self):
        """Test server discovery"""
        response = self.run_test(
            "Discover Servers",
            "GET",
            "discover/servers",
            200
        )
        return response is not None

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting EchoSphere API Tests")
        print("=" * 50)
        
        # Authentication tests
        print("\n📝 Testing Authentication...")
        if not self.test_auth_signup():
            print("❌ Signup failed, stopping tests")
            return False
            
        # Test login with the created account
        if not self.test_auth_login():
            print("❌ Login failed, stopping tests")
            return False
            
        self.test_auth_me()
        
        # Server tests
        print("\n🏠 Testing Server Management...")
        if not self.test_create_server():
            print("❌ Server creation failed, stopping server tests")
        else:
            self.test_get_servers()
            self.test_get_server_channels()
            self.test_create_channel()
        
        # Messaging tests
        print("\n💬 Testing Messaging...")
        if self.channel_id:
            self.test_send_message()
            self.test_get_messages()
        
        # DM tests
        print("\n📨 Testing Direct Messages...")
        self.test_create_dm()
        self.test_get_dms()
        
        # Search and discovery tests
        print("\n🔍 Testing Search & Discovery...")
        self.test_search_users()
        self.test_discover_servers()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = EchoSphereAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())