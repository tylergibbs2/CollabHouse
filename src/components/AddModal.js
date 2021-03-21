import { useForm } from "react-hook-form";


export const AddModal = ({ createComponent, addingComponent, stopAddingComponent }) => {
    const { register, handleSubmit } = useForm();

    if (!addingComponent)
        return (<></>)
    else
        return (
            <div tabIndex="-1" className={"modal-dialog fade modal-dialog-centered modal-dialog-scrollable " + (addingComponent ? "show" : "")}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit(createComponent)}>
                            <div className="modal-header">
                                <h5 className="modal-title">New {addingComponent} Component</h5>
                                <button type="button" className="btn-close" onClick={stopAddingComponent}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Content</label>
                                    <textarea name="content" className="form-control" rows="4" required ref={register} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={stopAddingComponent}>Close</button>
                                <button type="submit" className="btn btn-primary">Add</button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        )
}