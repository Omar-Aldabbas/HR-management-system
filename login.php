<?php
//secure cookie settings
session_start([
    // JS prevented from accessing the auth cookies (XSS attack security)
    'cookie_httponly' => true,
    // for production true , for development false (mean when we go Https go to true)
    'cookie_secure' => false,
    // prevent cookies froom being sent over cross site requests
    'cookie_samesite' => 'Strict'
]);

include 'config/config.php';

// if login to homepage 
if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$message = '';
// go to form see action = req then see type
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // seperate between  form types 
    $action = $_POST['action'] ?? '';

    if ($action === 'login') {
        $email = trim($_POST['email']);
        $password = $_POST['password'];

        // get user
        $stmt = $mysqli->prepare("SELECT id, name, password, role FROM users WHERE email=? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows === 1) {
            $user = $result->fetch_assoc();

            // verify password hash
            if (password_verify($password, $user['password'])) {

                // here tis for security agains session fixations
                // attacker gave user a fake session id 
                // user login with  it and now its the valid session id
                // attacker now has avalid one 
                // this line prevent the actions by recreate a random id after auth
                // killing the old (attacker) giving the secure
                session_regenerate_id(true);

                $_SESSION['user_id'] = $user['id'];
                $_SESSION['role'] = $user['role'];
                $_SESSION['name'] = $user['name'];

                // store session in DB for tracking & invalidation
                $session_id = session_id();
                //get user ip (idk why)
                $ip = $_SERVER['REMOTE_ADDR']; 
                //browser info capture
                $agent = $_SERVER['HTTP_USER_AGENT']; 

                $stmt2 = $mysqli->prepare("
                    REPLACE INTO sessions (session_id, user_id, ip_address, user_agent, last_activity)
                    VALUES (?, ?, ?, ?, NOW())
                ");
                $stmt2->bind_param("siss", $session_id, $user['id'], $ip, $agent);
                $stmt2->execute();

                header("Location: index.php");
                exit();
            }
        }
        $message = "Invalid email or password!";
    }

    if ($action === 'signup') {
        $name = trim($_POST['name']);
        $email = trim($_POST['email']);
        $password = $_POST['password'];
        $confirm_password = $_POST['confirm_password'];

        if (!$name || !$email || !$password || !$confirm_password) {
            $message = "All fields are required!";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $message = "Invalid email!";
        } elseif ($password !== $confirm_password) {
            $message = "Passwords do not match!";
        } else {
            $stmt = $mysqli->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $check = $stmt->get_result();

            if ($check->num_rows > 0) {
                $message = "Email already registered!";
            } else {
                // hash password before
                $hashed = password_hash($password, PASSWORD_BCRYPT);
                // default role
                $role = 'employee'; 

                $stmt2 = $mysqli->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
                $stmt2->bind_param("ssss", $name, $email, $hashed, $role);

                if ($stmt2->execute()) {
                    $message = "Account created successfully. Please log in.";
                } else {
                    $message = "Error creating account.";
                }
            }
        }
    }

    if ($action === 'forgot') {
        $email = trim($_POST['email']);

        // check email 
        $stmt = $mysqli->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows === 1) {
            //  later maybe we will send reset link via email
            // right now just this
            $message = "Password reset link sent to your email.";
        } else {
            $message = "Email not found!";
        }
    }
}
?>
<!DOCTYPE html>
<!-- <html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login - HR System</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link href="public/css/custom.css" rel="stylesheet">
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">
    <div class="bg-white p-8 rounded shadow-md w-96">
        <h1 class="text-2xl font-bold mb-4 text-center">HR System</h1>

        <?php if($message): ?>
            <p class="text-red-500 mb-4 text-center"><?php echo htmlspecialchars($message); ?></p>
        <?php endif; ?>

        <!-- LOGIN -->
        <form id="login-form" method="POST" class="">
            <input type="hidden" name="action" value="login">
            <label class="block mb-2">Email</label>
            <input type="email" name="email" class="w-full p-2 border rounded mb-4" required>
            <label class="block mb-2">Password</label>
            <input type="password" name="password" class="w-full p-2 border rounded mb-4" required>
            <button type="submit" class="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mb-2">Login</button>
            <p class="text-sm text-center">
                <a href="#" id="show-signup" class="text-blue-600 hover:underline">Sign Up</a> |
                <a href="#" id="show-forgot" class="text-blue-600 hover:underline">Forgot Password?</a>
            </p>
        </form>

        <!-- SIGNUP -->
        <form id="signup-form" method="POST" class="hidden">
            <input type="hidden" name="action" value="signup">
            <label class="block mb-2">Name</label>
            <input type="text" name="name" class="w-full p-2 border rounded mb-4" required>
            <label class="block mb-2">Email</label>
            <input type="email" name="email" class="w-full p-2 border rounded mb-4" required>
            <label class="block mb-2">Password</label>
            <input type="password" name="password" class="w-full p-2 border rounded mb-4" required>
            <label class="block mb-2">Confirm Password</label>
            <input type="password" name="confirm_password" class="w-full p-2 border rounded mb-4" required>
            <button type="submit" class="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 mb-2">Sign Up</button>
            <p class="text-sm text-center">
                <a href="#" id="back-to-login1" class="text-blue-600 hover:underline">Back to Login</a>
            </p>
        </form>

        <!-- FORGOT -->
        <form id="forgot-form" method="POST" class="hidden">
            <input type="hidden" name="action" value="forgot">
            <label class="block mb-2">Enter your email</label>
            <input type="email" name="email" class="w-full p-2 border rounded mb-4" required>
            <button type="submit" class="w-full bg-yellow-600 text-white p-2 rounded hover:bg-yellow-700 mb-2">Reset Password</button>
            <p class="text-sm text-center">
                <a href="#" id="back-to-login2" class="text-blue-600 hover:underline">Back to Login</a>
            </p>
        </form>
    </div>

    <script>
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const forgotForm = document.getElementById('forgot-form');

        document.getElementById('show-signup').addEventListener('click', e => {
            e.preventDefault(); loginForm.classList.add('hidden'); signupForm.classList.remove('hidden');
        });
        document.getElementById('show-forgot').addEventListener('click', e => {
            e.preventDefault(); loginForm.classList.add('hidden'); forgotForm.classList.remove('hidden');
        });
        document.getElementById('back-to-login1').addEventListener('click', e => {
            e.preventDefault(); signupForm.classList.add('hidden'); loginForm.classList.remove('hidden');
        });
        document.getElementById('back-to-login2').addEventListener('click', e => {
            e.preventDefault(); forgotForm.classList.add('hidden'); loginForm.classList.remove('hidden');
        });
    </script>
</body>
</html> -->
