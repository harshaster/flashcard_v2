var LOGIN_END_POINT="http://localhost:5000/api/login"
var SIGNUP_END_POINT="http://localhost:5000/api/signup"
var baseURL="http://localhost:5000"

const login = Vue.component('login',{
    data: function(){
        return {
            notGoodRes: false,
            sWrong: false
        }
    },
    template: `
    <div id="main-content">
        <div class="container">
            <div class="row justify-content-center">
                
                <div id="login-form" class="col col-sm-7 border">
                    <div class="alert alert-danger" v-if="notGoodRes" > Username or Password is incorrect </div>
                    <div class="alert alert-danger" v-if="sWrong"> Something went wrong. Please try again later. </div>
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
                        
                    </form>
                    <p style="text-align: center;">
                        Don't have an account ? <router-link to="/signup" onclick="changeTitle('Flashcard :: SignUp')"> Create New Account </router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>`,

    methods: {
        loginReq : async function(){
            this.notGoodRes=false;
            this.sWrong=false;
            document.getElementById("loading").style.visibility="visible";
            let login_res = await fetch(LOGIN_END_POINT, {
                method: 'POST',
                body: new FormData(document.getElementById("login-form-main"))
            })
            if (login_res.ok){
                login_data = await login_res.json()
                localStorage.setItem('token',login_data.token)
                document.getElementById("loading").style.visibility="hidden";
                setTimeout(()=>{},2000)
                this.$router.push(`/${login_data.username}`)
            }
            else if(login_res.status>=400 && login_res.status<500){
                this.notGoodRes=true;
                document.getElementById("loading").style.visibility="hidden";
            }
            else if(login_res.status>=500){
                this.sWrong=true;
                document.getElementById("loading").style.visibility="hidden";
            }
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
        },
        {
            path: '/:username/:deck_id',
            component: card_view,
        }
    ]
})

const app = new Vue({
    el: "#app",
    data: function(){
        return {
        logged:true,
        user_name:"Harshit",
    }
},
    router: router,
})

function changeTitle(newTitle){
    document.title=newTitle
}