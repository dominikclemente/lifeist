import React, { ChangeEvent, useEffect, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { useDocument, useDocumentData } from "react-firebase-hooks/firestore";
import firebase from "firebase";
import Goal from "../../Types/Goal.type";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthState } from "react-firebase-hooks/auth";

const GoalDetail = () => {
	let { id } = useParams();
	const history = useHistory();
	const [auth] = useAuthState(firebase.auth());
	const functions = firebase.app().functions("europe-west1");
	// Create a root reference
	var storageRef = firebase.storage().ref();

	function uploadFile() {
		function handleFiles(event: ChangeEvent<HTMLInputElement>) {
			const fileList = event.target.files; /* now you can work with the file list */
			if (fileList !== null) {
				const numFiles = fileList.length;
				if (numFiles > 0 && numFiles <= 5) {
					const promises = Array.from(fileList).map(f => {
						return storageRef.put(f);
					});

					Promise.all(promises).then(uploadedFiles => {
						return Promise.all(uploadedFiles.map(f => f.ref.getDownloadURL())).then(
							downloadUrls => {
								console.log(downloadUrls);
							}
						);
					});
				}
				// TODO: Throw error
				else {
					return;
				}
			} else {
				return;
			}
		}

		return (
			<div className="flex items-center justify-center w-1/2 ">
				<input type="file" multiple onChange={handleFiles} />
			</div>
		);
	}

	function toggleCompleteGoal() {
		goal?.ref.update({
			completed_on: firebase.firestore.Timestamp.now(),
			completed: !goalData?.completed
		} as Partial<Goal>);

		if ("vibrate" in window.navigator) {
			window.navigator.vibrate(300);
		}
	}

	function toggleArchiveGoal() {
		goal?.ref.update({
			archived: !goalData?.archived
		} as Partial<Goal>);
	}

	const [goal, loading] = useDocument(
		firebase
			.firestore()
			.collection("goals")
			.doc(id)
	);

	const [goalData] = useDocumentData<Goal>(
		firebase
			.firestore()
			.collection("goals")
			.doc(id)
	);

	const [sharedWithUsers, setSharedWithUsers] = useState<
		{
			email: string;
			photoUrl: string;
			displayName: string;
			uid: string;
		}[]
	>([]);

	useEffect(() => {
		if (goalData?.shared_with?.length) {
			const userPromises = goalData?.shared_with?.map(uid => {
				return functions.httpsCallable("getUserByUid")({ uid });
			});

			Promise.all(userPromises)
				// @ts-ignore
				.then(users => users.map(user => user.data))
				.then(users => setSharedWithUsers((users as unknown) as any));
		}
	}, [goalData, functions]);

	const [goalOwner, setGoalOwner] = useState<
		{ displayName: string; photoUrl: string } | undefined
	>(undefined);

	useEffect(() => {
		if (goalData) {
			functions
				.httpsCallable("getUserByUid")({ uid: goalData.owner_uid })
				.then(user => {
					// @ts-ignore
					setGoalOwner(user.data);
				});
		}
	}, [goalData, functions]);

	function addPersonToGoal(uid: string) {
		goal?.ref.update({
			shared_with: [...(goalData?.shared_with ?? []), uid]
		} as Partial<Goal>);
	}

	return (
		<div>
			<div className="flex items-center justify-between p-5">
				<Link to={"/dashboard"}>
					<svg fill="currentColor" className="w-8 h-8" viewBox="0 0 20 20">
						<path
							d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
							clipRule="evenodd"
							fillRule="evenodd"
						/>
					</svg>
				</Link>
			</div>

			<div className="p-5">
				{loading && (
					<SkeletonTheme color={"#232323"} highlightColor={"#444444"}>
						<div className="text-3xl font-medium mb-5">
							<Skeleton height={45} />
						</div>
						<div className={""}>
							<Skeleton height={80} />
						</div>
					</SkeletonTheme>
				)}
				{goalData && (
					<>
						<h1 className="text-3xl font-medium">{goalData.title}</h1>
						<p
							className={
								"text-gray-2 text-lg overflow-hidden mb-2" +
								(!goalData.description.length ? "italic text-gray-3" : "")
							}
						>
							{goalData.description.length ? goalData.description : "No description"}
						</p>

						{auth?.uid && goalData.owner_uid !== auth.uid && goalOwner && (
							<p>
								<p className="mr-2">Goal set by:</p>
								<UserPill
									name={goalOwner.displayName}
									photoUrl={goalOwner.photoUrl}
								/>
							</p>
						)}

						{sharedWithUsers.length > 0 && (
							<ShareSection
								onAdd={addPersonToGoal}
								sharedWithUsers={sharedWithUsers}
								hideAddButton={goalData.owner_uid !== auth?.uid}
							/>
						)}

						{goalData.owner_uid === auth?.uid && (
							<div className="w-full my-3">
								<Button
									className={
										"mb-3 w-full " +
										(goalData.completed
											? "bg-green-1 hover:bg-green-1 text-black"
											: "text-green-1")
									}
									onClick={toggleCompleteGoal}
								>
									<span className="text-xl">
										{goalData.completed
											? "Undo Mark as Completed"
											: "Mark as Completed"}
									</span>
									{goalData.completed ? (
										<svg
											className="w-8 h-8 ml-1"
											fill="none"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
										</svg>
									) : (
										<svg
											className="w-8 h-8 ml-1"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clipRule="evenodd"
												fillRule="evenodd"
											/>
										</svg>
									)}
								</Button>

								<div className="flex">
									<Button className="w-full" onClick={toggleArchiveGoal}>
										<span className="text-xl text-gray-2">
											{goalData.archived ? "Unarchive" : "Archive"}
										</span>
										{goalData.archived ? (
											<svg
												className="w-8 h-8 ml-1 text-gray-2"
												fill="none"
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
											</svg>
										) : (
											<svg
												fill="currentColor"
												viewBox="0 0 20 20"
												className="w-8 h-8 ml-1 text-gray-2"
											>
												<path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
												<path
													d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
													clipRule="evenodd"
													fillRule="evenodd"
												/>
											</svg>
										)}
									</Button>

									<Button
										className="ml-3 w-full"
										onClick={() => history.push("/edit/" + id)}
									>
										<span className="text-xl text-gray-100">Edit</span>
										<svg
											className="w-8 h-8 ml-1 text-gray-100"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
										</svg>
									</Button>
								</div>
								<DeleteButton
									onDelete={() => {
										goal?.ref.delete().then(() => {
											history.push("/dashboard");
										});
									}}
								/>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

function UserPill(props: { name: string; photoUrl: string }) {
	return (
		<motion.p className="mr-2 mb-2 inline-flex flex-row items-center p-3 rounded-full bg-background-lighter mb-2">
			<span>{props.name}</span>
			{props.photoUrl ? (
				<img
					alt={props.name + " profile picture"}
					src={props.photoUrl}
					className="h-6 w-6 rounded-full ml-1 border border-white"
				/>
			) : (
				<svg
					className="text-gray-3 w-6 h-6 rounded-full ml-1 border border-white"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
						clipRule="evenodd"
						fillRule="evenodd"
					/>
				</svg>
			)}
		</motion.p>
	);
}

function ShareSection(props: {
	onAdd: (uid: string) => any;
	sharedWithUsers: any[];
	hideAddButton?: boolean;
}) {
	const [peoplePickerOpen, setPeoplePickerOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [foundUser, setFoundUser] = useState<
		| undefined
		| {
				email: string;
				photoUrl: string;
				displayName: string;
				uid: string;
		  }
	>(undefined);

	const functions = firebase.app().functions("europe-west1");

	function onPickerChange(e: React.ChangeEvent<HTMLInputElement>) {
		const email = e.target.value;
		setEmail(email);
		const regex = new RegExp(
			"(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])"
		);
		if (!email.match(regex)) {
			return;
		}
		if (props.sharedWithUsers.map(user => user.email).includes(email)) {
			return;
		}
		functions
			.httpsCallable("getUserByEmail")({ email })
			.then(r => {
				if (r.data.email === email) {
					setFoundUser(r.data);
				}
			})
			.catch(e => console.error(e));
	}

	return (
		<>
			{props.sharedWithUsers && (
				<>
					<div className="mt-5 mb-2">Shared with:</div>
					<div className="flex flex-col mb-5 items-start">
						<div className="flex items-center flex-wrap w-full">
							{props.sharedWithUsers.map(user => (
								<UserPill name={user.displayName} photoUrl={user.photoUrl} />
							))}

							<div className="flex items-center w-full">
								<AnimatePresence>
									{peoplePickerOpen && (
										<motion.div
											className="overflow-hidden pr-2"
											initial={{ width: 0 }}
											animate={{ width: "100%" }}
											exit={{ width: 0 }}
										>
											<motion.input
												className="w-full mb-2 inline-flex flex-row items-center p-3 rounded
										 bg-background-lighter text-white outline-none hover:bg-background-lightest"
												type="text"
												value={email}
												onChange={onPickerChange}
											/>
										</motion.div>
									)}
								</AnimatePresence>

								{!props.hideAddButton && (
									<button
										className="p-3 mb-2 flex items-center rounded bg-background-lighter outline-none"
										onClick={() => setPeoplePickerOpen(!peoplePickerOpen)}
									>
										{peoplePickerOpen ? "Cancel" : "Invite"}
									</button>
								)}
							</div>
						</div>

						<AnimatePresence>
							{peoplePickerOpen && foundUser && (
								<motion.div
									initial={{ height: 0 }}
									animate={{ height: "auto" }}
									exit={{ height: 0 }}
									className="w-full flex justify-between items-center p-3 rounded bg-background-lighter
								 text-white outline-none hover:bg-background-lightest overflow-hidden"
								>
									<div className="flex items-center">
										{foundUser.photoUrl ? (
											<img
												alt={foundUser.displayName + " profile picture"}
												src={foundUser.photoUrl}
												className="inline h-6 w-6 rounded-full mr-1 border border-white"
											/>
										) : (
											<svg
												className="inline text-gray-3 w-6 h-6 rounded-full mr-1 border border-white"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
													clipRule="evenodd"
													fillRule="evenodd"
												/>
											</svg>
										)}

										<span>{foundUser.displayName}</span>
									</div>

									<button
										onClick={() => {
											if (foundUser) {
												props.onAdd(foundUser.uid);
											}
										}}
										className=""
									>
										<svg
											className="h-8 w-8 ml-1"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
												clipRule="evenodd"
											/>
										</svg>
									</button>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</>
			)}
		</>
	);
}

function DeleteButton(props: { onDelete: () => any }) {
	const [confirmShown, setConfirmShown] = useState(false);

	return (
		<Button
			className="w-full text-red-700 mt-3"
			onClick={() => {
				if (confirmShown) {
					props.onDelete();
				} else {
					setConfirmShown(true);
				}
			}}
		>
			<span className="text-xl">{confirmShown ? "Are you sure?" : "Delete"}</span>
			<svg className="w-8 h-8 ml-1 text-red-700" fill="currentColor" viewBox="0 0 20 20">
				<path
					d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
					clipRule="evenodd"
					fillRule="evenodd"
				/>
			</svg>
		</Button>
	);
}

export function Button(props: React.ComponentProps<"button">) {
	return (
		<button
			{...props}
			className={
				"py-4 px-6 font-medium flex justify-center items-center rounded bg-background-lighter hover:bg-background-lightest " +
				(props.className ?? "")
			}
		>
			{props.children}
		</button>
	);
}

export default GoalDetail;
