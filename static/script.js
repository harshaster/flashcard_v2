var baseURL="http://thefp2.herokuapp.com"
var LOGIN_END_POINT=`${baseURL}/api/login`
var SIGNUP_END_POINT=`${baseURL}/api/signup`


const login = Vue.component('login',{
    data: function(){
        return {
            notGoodRes: false,
            sWrong: false,
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
                        Don't have an account ? <router-link to="/signup"> Create New Account </router-link>
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
                this.$parent.logged=true, 
                localStorage.setItem("current_user",login_data.name)
                localStorage.setItem("token",login_data.token)
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
    },
    created: function(){
        document.title="Login";
        fetch(`${baseURL}/api/isAuth`, {
            method: 'GET',
            headers: {'Authorization': localStorage.getItem("token")},
        })
        .then(res => {
            if(res.ok){
                return res.json()
            }
            else{
                throw new Error()
            }
        })
        .then(data => {
            if (data["auth"]){
                this.$router.push(`/${data["username"]}`)
                this.$parent.logged=true;
            }
        })
        .catch(e => {})
    }
})

const signup = Vue.component('signup',{
    data: function(){
        return {
            status_text:"",
            status_class:"text-danger",
            pass:"",
            conf_pass:""
        }
    },
    computed: {
        matched: function(){
            if(this.pass && this.conf_pass){
                return (this.pass===this.conf_pass)
            }
            
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
                            <input type="text" name="username" autocomplete="off" required placeholder="Create a username">
                        </div>
                        <div class="row" id="email">
                            <input type="email" name="email" autocomplete="off" required placeholder="Enter your email" >
                        </div>
                        <div class="row pass">
                            <input type="password" v-model="pass" name="pswd" autocomplete="off" required placeholder="Enter new password" >
                        </div>
                        <div class="row pass"  id="pass-confirm">
                            <input type="password" v-model="conf_pass" name="conf-pswd" autocomplete="off" required placeholder="Confirm password">
                        </div>
                        <div class="row">
                            
                            <svg v-if="matched" style="color:green" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">Password matched
                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                            </svg>
                        </div>
                        <div class="row" id="submit">
                            <input class="btn btn-dark" type="button" @click="signupReq" value="Create Account">
                        </div>
                        <div v-bind:class="status_class" id="somethingWrong" style="display:none;text-align:center">{{status_text}}</div>
                    </form>
                    <p style="text-align: center;margin-top:5px">
                        Already have an account ? <router-link to="/"> Login here </router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>`,
    methods: {
        signupReq : function(){
            let status=document.getElementById("somethingWrong");
            status.style.display="none";
            if(document.getElementsByName("pswd")[0].value.length<8){
                alert("Password is too short");
                return false;
            }
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
                if(res.status===409){
                    return res.json()
                }
                if(!res.ok){
                    throw new Error("something wrong from server")}
                return res.json()})
            .then( data => {
                if(data["error_code"]){
                    if (data["error_code"]=="UNAEX"){
                        this.status_text="Username already exists."
                    }
                    else{
                        this.status_text="Something went wrong."
                    }
                }
                else{
                    this.status_class="text-success";
                    this.status_text="Account successfully created ! Redirecting to dashboard ..."
                    this.sleep(2000)
                    localStorage.setItem("token",data.token)
                    localStorage.setItem("current_user",data.name)
                    this.$router.push(`/${data.username}`)
                }
                status.style.display="block";
                document.getElementById("loading").style.visibility="hidden";
                // console.log(data);
            })
            .catch(e => {
                this.status_text="Something went wrong."
                status.style.display="block";
                document.getElementById("loading").style.visibility="hidden";
                console.log("Error occured : "+e)})
        },
        sleep: function (ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    },
    created: function(){
        this.title="Sign Up"
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
    data : {
        logged: false
    },
    router: router,
    methods: {
        logout: function(){
            localStorage.setItem("token","")
            localStorage.setItem("current_user","")
            this.username=false
            this.$router.push("/")
        }
    }
})
