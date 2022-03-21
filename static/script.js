var LOGIN_END_POINT="http://localhost:5000/api/login"
var SIGNUP_END_POINT="http://localhost:5000/api/signup"
var baseURL="http://localhost:5000"

const login = Vue.component('login',{
    template: `
    <div id="main-content">
        <div class="container">
            <div class="row justify-content-center">
                <div id="login-form" class="col col-sm-7 border">
                    <div class="h2" style="text-align: center;margin-bottom: 20px;">Login to your account</div>
                    <form id="login-form-main">
                        <div class="row" id="username">
                            <input type="text" name="username" required placeholder="Enter username">
                        </div>
                        <div class="row" id="pass">
                            <input type="password" name="pswd" required placeholder="Enter password">
                        </div>
                        <div class="row" id="submit">
                            <input class="btn btn-dark" v-on:click="loginReq" type="button" value="Login">
                        </div>
                        <div class="text-danger" id="somethingWrong" style="display:none;text-align:center"> Username or Password is incorrect </div>
                    </form>
                    <p style="text-align: center;">
                        Don't have an account ? <router-link to="/signup" onclick="changeTitle('Flashcard :: SignUp')"> Create New Account </router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>`,

    methods: {
        loginReq : function(){
            document.getElementById("loading").style.visibility="visible";
            document.getElementById("somethingWrong").style.display="none";
            fetch(LOGIN_END_POINT, {
                method: 'POST',
                body: new FormData(document.getElementById("login-form-main"))
            })
            .then(res => {
                if(res.ok){
                    return res.json()
                }
            })
            .then(
                data => {
                    if(data!="True"){
                        document.getElementById("somethingWrong").style.display="block"}
                    else{
                        this.$emit("log-success");
                    }
                    document.getElementById("loading").style.visibility="hidden";
                    console.log(data)}
            )
        }
    }
})

const signup = Vue.component('signup',{
    data: function(){
        return {
            status_text:"",
            status_class:"text-danger",
        }
    },
    template: `
    <div id="main-content">
        <div class="container">
            <div class="row justify-content-center">
                <div id="signup-form" class="col col-sm-7 border">
                    <div class="h2" style="text-align: center;margin-bottom: 20px;">Create new account</div>
                    <form id="signup-form-main">
                        <div class="row" id="name">
                            <input type="text" name="name" required placeholder="Your name">
                        </div>
                        <div class="row" id="username">
                            <input type="text" name="username" required placeholder="Create a username">
                        </div>
                        <div class="row" id="email">
                            <input type="email" name="email" required placeholder="Enter your email"">
                        </div>
                        <div class="row pass">
                            <input type="password" name="pswd" required placeholder="Enter new password">
                        </div>
                        <div class="row pass"  id="pass-confirm">
                            <input type="password" name="conf-pswd" required placeholder="Confirm password">
                        </div>
                        <div class="row" id="submit">
                            <input class="btn btn-dark" type="button" @click="signupReq" value="Create Account">
                        </div>
                        <div v-bind:class="status_class" id="somethingWrong" style="display:none;text-align:center">{{status_text}}</div>
                    </form>
                    <p style="text-align: center;margin-top:5px">
                        Already have an account ? <router-link to="/" onclick="changeTitle('Flashcard :: Login')"> Login here </router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>`,
    methods: {
        signupReq : function(){
            let status=document.getElementById("somethingWrong");
            if(document.getElementsByName("pswd")[0].value!=document.getElementsByName("conf-pswd")[0].value){
                alert("Password do not match ! Please try again")
                return false
            }
            document.getElementById("loading").style.visibility="visible";
            status.style.display="none";
            fetch(SIGNUP_END_POINT, {
                method: 'POST',
                body: new FormData(document.getElementById("signup-form-main"))
            })
            .then(res => {
                if(!res.ok){
                    throw new Error("something wrong from server")}
                document.getElementById("loading").style.visibility="hidden";
                return res.json()})
            .then( data => {
                if (data!="True"){
                    if(data === "Already Exists"){
                        this.status_text="Username already exists."
                    }
                    else{
                        this.status_text="Something went wrong."
                    }
                }
                
                else{
                    this.status_class="text-success";
                    this.status_text="Account successfully created ! You can login now."
                }
                status.style.display="block";
                console.log(data);
            })
            .catch(e => {
                this.status_text="Something went wrong."
                status.style.display="block";
                console.log("Error occured : "+e)})
        }
    }
})

var router = new VueRouter({
    routes: [
        {
            path: "/",
            component: login
        },
        {
            path: '/signup',
            component: signup,
        },
        {
            path: '/:username',
            component: dashboard
        }
    ]
})

const app = new Vue({
    el: "#app",
    data: {
        logged:false,
        user_name:undefined
    },
    methods: {
        logged_in: function(){
            this.logged=true;
            this.user_name="Harshit";
        }
    },
    components: {
        login,
        signup,
        deck_obj
    },
    router: router,
})

function changeTitle(newTitle){
    document.title=newTitle
}