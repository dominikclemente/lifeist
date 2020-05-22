import React, { Component, useContext, useState } from "react";
import * as firebase from "firebase";
import { useHistory } from "react-router-dom";

const Home = () => {
	const history = useHistory();

	firebase.auth().onAuthStateChanged(user => {
		if (firebase.auth().currentUser !== null) {
			history.push("/dashboard");
		}
	});

	const googleProvider = new firebase.auth.GoogleAuthProvider();

	return (
		<main className="w-full flex flex-col p-3">
			<nav className="mb-3">
				<a className="text-3xl text-gray-900 font-sans">BucketList</a>
			</nav>

			<section className="">
				<Quote author={"Jolanda"} text={"Hodně budeš někde."} />
			</section>

			<div>{"LOG IN YOU FUCKER"}</div>
			<section>
				<button
					onClick={() => {
						firebase.auth().signInWithRedirect(googleProvider);
					}}
				>
					AUTHENTICATE!!!
				</button>
			</section>
		</main>
	);
};

function Quote(
	props: React.ComponentProps<"div"> & {
		author: string;
		text: string;
	}
) {
	return (
		<div className="flex flex-col">
			<div className="text-gray-700 ">{props.text}</div>
			<div className="text-gray-500 self-end"> - {props.author}</div>
		</div>
	);
}

export default Home;
